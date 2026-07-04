"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Star, ImageOff, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { BADGE_LABEL, type DiscoverProduct } from "@/lib/giftmind/discover";
import { resolveDiscoverMedia } from "@/lib/actions/discover";

const BADGE_STYLE: Record<string, string> = {
  "most-gifted": "bg-primary text-primary-foreground",
  "top-rated": "bg-[#e0a92e] text-[#3a2c05]",
  "editors-pick": "bg-background/90 text-primary ring-1 ring-primary/25 backdrop-blur",
};

// Throttle how many product pages we scrape at once across the whole grid.
const MAX_CONCURRENT = 3;
let active = 0;
const waiters: Array<() => void> = [];
async function gate<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) await new Promise<void>((r) => waiters.push(r));
  active++;
  try {
    return await fn();
  } finally {
    active--;
    waiters.shift()?.();
  }
}

/**
 * An editorial gift card showing a *real* scraped product photo. Clicking it
 * opens the in-app product detail page (full gallery, description, buy button)
 * rather than jumping straight to the merchant. Cached photos render instantly;
 * uncached cards scrape their thumbnail lazily once scrolled into view.
 */
export function DiscoverCard({
  product,
  note,
  initial,
}: {
  product: DiscoverProduct;
  note?: string;
  initial?: { imageUrl: string | null };
}) {
  // undefined = not resolved yet; string|null = resolved (null = no photo).
  const [imageUrl, setImageUrl] = useState<string | null | undefined>(initial ? initial.imageUrl : undefined);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLAnchorElement>(null);
  const resolved = imageUrl !== undefined;

  useEffect(() => {
    if (resolved) return;
    const el = ref.current;
    if (!el) return;
    let started = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (started || !entries.some((e) => e.isIntersecting)) return;
        started = true;
        io.disconnect();
        setLoading(true);
        gate(() => resolveDiscoverMedia(product.searchQuery))
          .then((m) => setImageUrl(m.imageUrl))
          .catch(() => setImageUrl(null))
          .finally(() => setLoading(false));
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [resolved, product.searchQuery]);

  return (
    <Link
      ref={ref}
      href={`/dashboard/discover/${product.id}` as never}
      className="group flex flex-col rounded-2xl border border-border bg-card p-2 shadow-sm transition-shadow hover:shadow-md sm:p-2.5"
    >
      <div className="relative aspect-[5/4] overflow-hidden rounded-lg bg-muted sm:rounded-xl">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-secondary text-muted-foreground">
            {loading || !resolved ? <Loader2 className="h-5 w-5 animate-spin opacity-70" /> : <ImageOff className="h-5 w-5 opacity-60" />}
          </div>
        )}
        {product.badge && (
          <span
            className={cn(
              "absolute left-2 top-2 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide shadow-sm",
              BADGE_STYLE[product.badge],
            )}
          >
            {BADGE_LABEL[product.badge]}
          </span>
        )}
        {note && (
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 pb-1.5 pt-5 text-[10px] font-semibold text-white">
            {note}
          </span>
        )}
      </div>

      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#b8860b] sm:mt-2 sm:text-[11px]">
        <Star className="h-3 w-3 fill-[#e0a92e] text-[#e0a92e]" />
        {product.rating.toFixed(1)}
        <span className="font-medium text-muted-foreground">({product.reviews.toLocaleString()})</span>
      </div>

      <h3 className="mt-1 truncate font-serif text-[13px] font-bold leading-tight text-foreground group-hover:text-primary sm:text-sm">
        {product.name}
      </h3>
      <p className="mt-0.5 line-clamp-1 hidden text-[11px] text-muted-foreground sm:block">{product.rationale}</p>

      <div className="mt-1.5 flex items-end justify-between gap-2 sm:mt-2">
        <p className="text-[13px] font-bold text-primary sm:text-sm">${product.price}</p>
        <span className="text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
          View →
        </span>
      </div>
    </Link>
  );
}
