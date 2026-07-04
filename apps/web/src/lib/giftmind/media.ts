// Pure URL helpers for product imagery, buy links, and videos.
// No API keys required — images come from Pollinations (keyless AI image URL),
// buy links go to Amazon search, videos to YouTube search. Swap in real
// product APIs later without touching the UI.

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 100000;
}

export function productImageUrl(query: string, opts?: { w?: number; h?: number; variant?: number }) {
  const w = opts?.w ?? 640;
  const h = opts?.h ?? 480;
  const seed = hashSeed(query) + (opts?.variant ?? 0) * 7919;
  const prompt = `${query}, product photography, clean studio lighting, soft neutral background, high detail`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&seed=${seed}&nologo=true&model=flux`;
}

export function amazonSearchUrl(query: string, tag?: string | null) {
  const base = `https://www.amazon.com/s?k=${encodeURIComponent(query)}`;
  return tag ? `${base}&tag=${encodeURIComponent(tag)}` : base;
}

/**
 * Append the Amazon Associates tag to an Amazon product URL so purchases that
 * originate from our site earn commission. No-op for non-Amazon URLs.
 */
export function withAmazonTag(url: string, tag?: string | null): string {
  if (!tag || !url) return url;
  try {
    const u = new URL(url);
    if (!/(^|\.)amazon\.[a-z.]+$/i.test(u.hostname)) return url;
    u.searchParams.set("tag", tag);
    return u.toString();
  } catch {
    return url;
  }
}

export function googleShoppingUrl(query: string) {
  return `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
}

export function youtubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export type VideoLink = { label: string; url: string };

export function videoLinksFor(query: string): VideoLink[] {
  return [
    { label: "Reviews", url: youtubeSearchUrl(`${query} review`) },
    { label: "Unboxing", url: youtubeSearchUrl(`${query} unboxing`) },
    { label: "In action", url: youtubeSearchUrl(`${query} how to use`) },
  ];
}
