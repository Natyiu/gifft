import "server-only";

import { amazonSearchUrl, withAmazonTag } from "./media";

// ── Firecrawl-powered product finder ────────────────────────────────
// For each AI-generated gift idea we take its precise `searchQuery`, find the
// real product on the web (Amazon first — that's where the affiliate commission
// is — then other merchants), scrape the listing for a real image + price, and
// return a clickable buy URL. Everything is best-effort: any failure falls back
// to an Amazon search link so the gift is always still clickable.
//
// Uses the Firecrawl REST API directly via fetch (version-proof, no SDK pin).

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";
const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

// Merchants we trust to scrape, in priority order. Amazon first for commission.
const PREFERRED_HOSTS = ["amazon.", "etsy.com", "uncommongoods.com", "notonthehighstreet.com"];

const MAX_IMAGES = 5;

export type FoundProduct = {
  buyUrl: string;
  imageUrl: string | null; // primary image (kept for back-compat = imageUrls[0])
  imageUrls: string[]; // full gallery, primary first, up to MAX_IMAGES
  priceText: string | null;
  source: string; // amazon | etsy | web | search
};

/** The stable Amazon image id (the `/images/I/<id>` segment before the first `.`),
 *  used to dedupe the same photo served at different sizes. */
function amazonImageId(url: string): string {
  const m = url.match(/\/images\/I\/([^./"'\\]+)/);
  return m ? m[1] : url;
}

/** Append `url` to `out` unless a same-photo url is already present. */
function pushImage(out: string[], seen: Set<string>, url: string | null | undefined) {
  if (!url) return;
  const clean = unescapeUrl(url).replace(/^http:\/\//i, "https://");
  if (!/^https:\/\//i.test(clean)) return;
  const key = clean.includes("/images/I/") ? amazonImageId(clean) : clean;
  if (seen.has(key)) return;
  seen.add(key);
  out.push(clean);
}

type SearchHit = { url: string; title?: string; description?: string };

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
}

function sourceFromHost(host: string): string {
  if (host.includes("amazon.")) return "amazon";
  if (host.includes("etsy.")) return "etsy";
  return "web";
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms);
  });
  try {
    return (await Promise.race([p, timeout])) as T | null;
  } finally {
    clearTimeout(timer!);
  }
}

async function firecrawlSearch(apiKey: string, query: string, limit = 5): Promise<SearchHit[]> {
  const res = await fetch(`${FIRECRAWL_BASE}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { success?: boolean; data?: SearchHit[] };
  return Array.isArray(json.data) ? json.data : [];
}

type ImageHit = { imageUrl?: string; imageWidth?: number; imageHeight?: number };

/**
 * Image-search fallback (Firecrawl v2, web/Google image results). Used to top up
 * the gallery when the product page itself didn't yield enough images — finds
 * real photos of the same product so we can always show several angles instead
 * of a placeholder. Prefers reasonably large images (biggest first) and upgrades
 * http→https to avoid mixed-content blocking. Returns up to `max` unique urls.
 */
async function searchImages(apiKey: string, query: string, max = MAX_IMAGES): Promise<string[]> {
  const res = await fetch(`${FIRECRAWL_V2}/search`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query, sources: ["images"], limit: 12 }),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { data?: { images?: ImageHit[] } };
  const imgs = (json.data?.images ?? [])
    .filter((i) => i.imageUrl)
    .sort((a, b) => (b.imageWidth ?? 0) - (a.imageWidth ?? 0));
  const out: string[] = [];
  const seen = new Set<string>();
  for (const i of imgs) {
    pushImage(out, seen, i.imageUrl);
    if (out.length >= max) break;
  }
  return out;
}

type ScrapeResult = { imageUrls: string[]; priceText: string | null };

const unescapeUrl = (s: string) => s.replace(/\\u002F/gi, "/").replace(/\\\//g, "/").trim();

/**
 * Every product image in Amazon's gallery — they JS-load the carousel, so we
 * pull the image data straight from the raw HTML. The `colorImages` block holds
 * one entry per thumbnail with `hiRes`/`large` urls; we collect them in gallery
 * order and dedupe the same photo served at different sizes. Returns up to
 * `max` images (main photo first).
 */
function amazonImages(html: string, max = MAX_IMAGES): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  // Lead image first so the main photo stays first in the gallery.
  const lead =
    html.match(/data-old-hires="(https:\/\/[^"]+)"/)?.[1] ??
    html.match(/id="landingImage"[^>]*\bsrc="(https:\/\/[^"]+)"/)?.[1];
  pushImage(out, seen, lead);

  // Carousel images, hiRes preferred then large, in the order Amazon lists them.
  for (const re of [
    /"hiRes":"(https:[^"]+m\.media-amazon\.com\/images\/I\/[^"]+)"/g,
    /"large":"(https:[^"]+m\.media-amazon\.com\/images\/I\/[^"]+)"/g,
  ]) {
    for (const m of html.matchAll(re)) {
      pushImage(out, seen, m[1]);
      if (out.length >= max) return out;
    }
  }

  // Last resort: any high-res product image url in the page.
  if (out.length === 0) {
    for (const m of html.matchAll(
      /https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9%+._-]+\._AC_SL\d+_\.(?:jpg|jpeg|png|webp)/gi,
    )) {
      pushImage(out, seen, m[0]);
      if (out.length >= max) break;
    }
  }
  return out;
}

function ogImageFrom(html: string, meta: Record<string, unknown>): string | null {
  for (const k of ["ogImage", "og:image", "twitter:image", "image"]) {
    const v = meta[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (Array.isArray(v) && typeof v[0] === "string" && v[0].trim()) return v[0].trim();
  }
  const m =
    html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  return m ? m[1] : null;
}

function markdownImages(md: string, max = MAX_IMAGES): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const m of md.matchAll(/!\[[^\]]*\]\((https?:\/\/[^)\s]+\.(?:jpg|jpeg|png|webp)[^)\s]*)\)/gi)) {
    pushImage(out, seen, m[1]);
    if (out.length >= max) break;
  }
  return out;
}

function priceFrom(html: string, md: string, meta: Record<string, unknown>, isAmazon: boolean): string | null {
  if (isAmazon) {
    const m = html.match(/class="a-offscreen">\s*(\$[\d,]+(?:\.\d{2})?)/);
    if (m) return m[1];
  }
  for (const k of ["product:price:amount", "og:price:amount", "price"]) {
    const v = meta[k];
    if (typeof v === "string" && v.trim()) return v.trim().startsWith("$") ? v.trim() : `$${v.trim()}`;
  }
  const m = md.match(/\$\s?\d[\d,]*(?:\.\d{2})?/);
  return m ? m[0].replace(/\s/g, "") : null;
}

async function firecrawlScrape(apiKey: string, url: string, isAmazon: boolean): Promise<ScrapeResult> {
  const res = await fetch(`${FIRECRAWL_BASE}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url, formats: ["markdown", "html"], onlyMainContent: false }),
  });
  if (!res.ok) return { imageUrls: [], priceText: null };
  const json = (await res.json()) as {
    data?: { markdown?: string; html?: string; metadata?: Record<string, unknown> };
  };
  const html = json.data?.html ?? "";
  const md = json.data?.markdown ?? "";
  const meta = json.data?.metadata ?? {};

  const out: string[] = [];
  const seen = new Set<string>();
  if (isAmazon) {
    for (const u of amazonImages(html)) pushImage(out, seen, u);
    pushImage(out, seen, ogImageFrom(html, meta));
  } else {
    // og:image is usually the primary/best shot, then any inline gallery images.
    pushImage(out, seen, ogImageFrom(html, meta));
    for (const u of markdownImages(md)) pushImage(out, seen, u);
  }
  const priceText = priceFrom(html, md, meta, isAmazon);

  return { imageUrls: out.slice(0, MAX_IMAGES), priceText };
}

/** Pick the best hit, preferring Amazon then other trusted merchants. */
function rankHits(hits: SearchHit[]): SearchHit | null {
  if (hits.length === 0) return null;
  for (const host of PREFERRED_HOSTS) {
    const hit = hits.find((h) => hostOf(h.url).includes(host));
    if (hit) return hit;
  }
  return hits[0];
}

/**
 * Canonical Amazon product URL for a hit, or null if it's not a product page
 * (e.g. a store/search/brand page). Returns clean `/dp/<ASIN>` so the image we
 * scrape and the "Buy on Amazon" link point at the exact same listing.
 */
function amazonProductUrl(url: string): string | null {
  if (!hostOf(url).includes("amazon.")) return null;
  const m = url.match(/\/(?:dp|gp\/product|gp\/aw\/d|gp\/aw\/d)\/([A-Z0-9]{10})(?:[/?]|$)/i);
  return m ? `https://www.amazon.com/dp/${m[1].toUpperCase()}` : null;
}

/**
 * Find one real, buyable product for a gift idea.
 * @param query  the AI's precise product search string
 * @param keys   resolved API key + affiliate tag
 */
export async function findProduct(
  query: string,
  keys: { firecrawlKey?: string | null; amazonTag?: string | null; skipImages?: boolean },
): Promise<FoundProduct> {
  const fallback: FoundProduct = {
    buyUrl: amazonSearchUrl(query, keys.amazonTag),
    imageUrl: null,
    imageUrls: [],
    priceText: null,
    source: "search",
  };

  const apiKey = keys.firecrawlKey?.trim();
  if (!apiKey) return fallback;

  // Build the final gallery: the images scraped from the product page, topped up
  // with same-product image-search results if the page gave us fewer than we
  // want, so the detail page can show several angles of what they're buying.
  async function buildGallery(scraped: string[]): Promise<string[]> {
    const out: string[] = [];
    const seen = new Set<string>();
    for (const u of scraped) pushImage(out, seen, u);
    if (out.length < MAX_IMAGES) {
      const extra = (await withTimeout(searchImages(apiKey!, query), 12_000)) ?? [];
      for (const u of extra) {
        pushImage(out, seen, u);
        if (out.length >= MAX_IMAGES) break;
      }
    }
    return out.slice(0, MAX_IMAGES);
  }

  try {
    // 1) Find a real Amazon PRODUCT page (/dp/<ASIN>). The image we scrape and
    //    the "Buy on Amazon" link both point at this exact listing — so what the
    //    user sees is what they get when they click through.
    const amzHits = (await withTimeout(firecrawlSearch(apiKey, `${query} site:amazon.com`, 8), 12_000)) ?? [];
    const amzProduct = amzHits.map((h) => amazonProductUrl(h.url)).find((u): u is string => Boolean(u));

    if (amzProduct) {
      const scraped = await withTimeout(firecrawlScrape(apiKey, amzProduct, true), 25_000);
      const imageUrls = keys.skipImages ? [] : await buildGallery(scraped?.imageUrls ?? []);
      return {
        buyUrl: withAmazonTag(amzProduct, keys.amazonTag),
        imageUrl: imageUrls[0] ?? null,
        imageUrls,
        priceText: scraped?.priceText ?? null,
        source: "amazon",
      };
    }

    // 2) Not on Amazon → fall back to another merchant; image + buy link still
    //    come from that same product page.
    const webHits = (await withTimeout(firecrawlSearch(apiKey, `buy ${query}`, 6), 12_000)) ?? [];
    const webHit = rankHits(webHits);
    if (!webHit) return fallback;

    const source = sourceFromHost(hostOf(webHit.url));
    const scraped = await withTimeout(firecrawlScrape(apiKey, webHit.url, false), 25_000);
    const imageUrls = keys.skipImages ? [] : await buildGallery(scraped?.imageUrls ?? []);
    return {
      buyUrl: webHit.url,
      imageUrl: imageUrls[0] ?? null,
      imageUrls,
      priceText: scraped?.priceText ?? null,
      source,
    };
  } catch (err) {
    console.error("[GiftMind] product-finder failed for query:", query, err);
    return fallback;
  }
}

// ── Scrape a user-pasted product link (for the wishlist) ────────────

export type ScrapedProduct = {
  title: string;
  imageUrl: string | null;
  priceText: string | null;
  source: string;
  buyUrl: string;
};

const decodeEntities = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

function cleanTitle(s: string): string {
  return decodeEntities(s)
    .replace(/\s+/g, " ")
    .replace(/\s*[-|–]\s*(amazon\.com|amazon|etsy).*$/i, "")
    .trim()
    .slice(0, 160);
}

/** A readable fallback title from the URL path (e.g. Amazon /Product-Name/dp/…). */
function titleFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter((s) => s && !/^(dp|gp|product|itm|listing|ref.*)$/i.test(s) && !/^[A-Z0-9]{10}$/.test(s))[0];
    if (seg) return cleanTitle(decodeURIComponent(seg).replace(/[-_+]/g, " "));
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "Wishlist item";
  }
}

function titleFrom(html: string, md: string, meta: Record<string, unknown>): string | null {
  for (const k of ["ogTitle", "og:title", "twitter:title", "title"]) {
    const v = meta[k];
    if (typeof v === "string" && v.trim()) return cleanTitle(v);
    if (Array.isArray(v) && typeof v[0] === "string" && v[0].trim()) return cleanTitle(v[0]);
  }
  const t = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (t) return cleanTitle(t[1]);
  const h = md.match(/^#\s+(.+)$/m);
  if (h) return cleanTitle(h[1]);
  return null;
}

/**
 * Scrape a single product page the user pasted into their wishlist and return
 * its title, image, and price. Best-effort: on any failure (or no Firecrawl
 * key) we still return a usable title derived from the URL.
 */
export async function scrapeProductUrl(
  url: string,
  keys: { firecrawlKey?: string | null; amazonTag?: string | null },
): Promise<ScrapedProduct> {
  const host = hostOf(url);
  const isAmazon = host.includes("amazon.");
  const source = sourceFromHost(host);
  const buyUrl = isAmazon ? withAmazonTag(url, keys.amazonTag) : url;
  const fallback: ScrapedProduct = { title: titleFromUrl(url), imageUrl: null, priceText: null, source, buyUrl };

  const apiKey = keys.firecrawlKey?.trim();
  if (!apiKey) return fallback;

  try {
    const res = await withTimeout(
      fetch(`${FIRECRAWL_BASE}/scrape`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url, formats: ["markdown", "html"], onlyMainContent: false }),
      }),
      25_000,
    );
    if (!res || !res.ok) return fallback;
    const json = (await res.json()) as {
      data?: { markdown?: string; html?: string; metadata?: Record<string, unknown> };
    };
    const html = json.data?.html ?? "";
    const md = json.data?.markdown ?? "";
    const meta = json.data?.metadata ?? {};

    const rawImage = isAmazon ? amazonImages(html)[0] ?? ogImageFrom(html, meta) : ogImageFrom(html, meta) ?? markdownImages(md)[0] ?? null;
    let imageUrl = rawImage ? unescapeUrl(rawImage).replace(/^http:\/\//i, "https://") : null;

    const title = titleFrom(html, md, meta) ?? fallback.title;

    // The product page often hides its image behind JS (no OG tag), so a direct
    // scrape comes back empty. Fall back to an image search on the product title
    // so the wishlist card still shows a real photo instead of a placeholder.
    if (!imageUrl && title) {
      const found = (await withTimeout(searchImages(apiKey, title, 1), 12_000)) ?? [];
      if (found[0]) imageUrl = unescapeUrl(found[0]).replace(/^http:\/\//i, "https://");
    }

    return {
      title,
      imageUrl,
      priceText: priceFrom(html, md, meta, isAmazon),
      source,
      buyUrl,
    };
  } catch (err) {
    console.error("[GiftMind] wishlist scrape failed for:", url, err);
    return fallback;
  }
}

/** Enrich many ideas in parallel with a small concurrency cap. */
export async function findProducts(
  queries: string[],
  keys: { firecrawlKey?: string | null; amazonTag?: string | null; skipImages?: boolean },
  concurrency = 4,
): Promise<FoundProduct[]> {
  const results: FoundProduct[] = new Array(queries.length);
  let next = 0;
  async function worker() {
    while (next < queries.length) {
      const i = next++;
      results[i] = await findProduct(queries[i], keys);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, queries.length) }, worker));
  return results;
}
