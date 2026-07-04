"use server";

import prisma from "@Batman/db";

import { findProduct } from "@/lib/giftmind/product-finder";

export type DiscoverMedia = {
  imageUrl: string | null;
  imageUrls: string[];
  buyUrl: string | null;
  priceText: string | null;
};

function keys() {
  return {
    firecrawlKey: (process.env.FIRECRAWL_API_KEY || "").trim() || null,
    amazonTag: (process.env.AMAZON_ASSOCIATE_TAG || "").trim() || null,
  };
}

// De-dupe concurrent scrapes of the same query within a single server instance.
const inflight = new Map<string, Promise<DiscoverMedia>>();

/**
 * Resolve a real, scraped product photo (+ buy link + price) for a Discover
 * product. Cached in the DB keyed by `searchQuery`, so each product is scraped
 * once via Firecrawl and served from the cache forever after. Best-effort: on
 * any failure returns nulls and the card falls back to a plain placeholder +
 * affiliate search link.
 */
export async function resolveDiscoverMedia(searchQuery: string): Promise<DiscoverMedia> {
  const q = searchQuery.trim();
  if (!q) return { imageUrl: null, imageUrls: [], buyUrl: null, priceText: null };

  // Served from cache once scraped (row exists — even if imageUrl is null, we
  // don't re-scrape a known miss on every visit).
  const cached = await prisma.discoverMedia.findUnique({ where: { searchQuery: q } });
  if (cached) {
    return {
      imageUrl: cached.imageUrl,
      imageUrls: cached.imageUrls.length ? cached.imageUrls : cached.imageUrl ? [cached.imageUrl] : [],
      buyUrl: cached.buyUrl,
      priceText: cached.priceText,
    };
  }

  const pending = inflight.get(q);
  if (pending) return pending;

  const run = (async (): Promise<DiscoverMedia> => {
    const found = await findProduct(q, keys());
    const media: DiscoverMedia = {
      imageUrl: found.imageUrl,
      imageUrls: found.imageUrls ?? [],
      buyUrl: found.source === "search" ? null : found.buyUrl,
      priceText: found.priceText,
    };
    await prisma.discoverMedia
      .upsert({
        where: { searchQuery: q },
        create: { searchQuery: q, imageUrl: media.imageUrl, imageUrls: media.imageUrls, buyUrl: media.buyUrl, priceText: media.priceText, source: found.source },
        update: { imageUrl: media.imageUrl, imageUrls: media.imageUrls, buyUrl: media.buyUrl, priceText: media.priceText, source: found.source },
      })
      .catch(() => {});
    return media;
  })();

  inflight.set(q, run);
  try {
    return await run;
  } finally {
    inflight.delete(q);
  }
}
