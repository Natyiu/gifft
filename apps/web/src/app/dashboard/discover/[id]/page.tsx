import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Star, ShoppingBag, ExternalLink, Play } from "lucide-react";

import { GiftGallery } from "@/components/giftmind/gift-gallery";
import { resolveDiscoverMedia } from "@/lib/actions/discover";
import { amazonSearchUrl, videoLinksFor } from "@/lib/giftmind/media";
import { DISCOVER_PRODUCTS, NICHES, PERSONAS, DISCOVER_OCCASIONS, BADGE_LABEL } from "@/lib/giftmind/discover";

export const dynamic = "force-dynamic";

const labelOf = (list: { value: string; label: string; emoji?: string }[], v: string) => list.find((x) => x.value === v);

export default async function DiscoverProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = DISCOVER_PRODUCTS.find((p) => p.id === id);
  if (!product) notFound();

  const amazonTag = (process.env.AMAZON_ASSOCIATE_TAG || "").trim() || null;

  // Real scraped gallery + buy link (cached after the first visit).
  const media = await resolveDiscoverMedia(product.searchQuery);
  const images = media.imageUrls.length ? media.imageUrls : media.imageUrl ? [media.imageUrl] : [];
  const buyUrl = media.buyUrl || amazonSearchUrl(product.searchQuery, amazonTag);
  const isAmazon = /(^|\.)amazon\./i.test((() => { try { return new URL(buyUrl).hostname; } catch { return ""; } })());
  const priceText = media.priceText || `$${product.price}`;

  const niche = labelOf(NICHES, product.niche);
  const videos = videoLinksFor(product.name);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/dashboard/discover"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Discover
      </Link>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        {/* Gallery */}
        <GiftGallery images={images} alt={product.name} />

        {/* Info */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.badge && (
              <span className="rounded-full bg-primary/12 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-primary whitespace-nowrap">
                {BADGE_LABEL[product.badge]}
              </span>
            )}
            {niche && (
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground whitespace-nowrap">
                {niche.emoji} {niche.label}
              </span>
            )}
          </div>

          <h1 className="mt-3 font-serif text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{product.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className={i < Math.round(product.rating) ? "h-4 w-4 fill-[#e0a92e] text-[#e0a92e]" : "h-4 w-4 text-muted-foreground/30"}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-foreground">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">({product.reviews.toLocaleString()} reviews)</span>
            </div>
            <span className="text-2xl font-bold text-primary">{priceText}</span>
          </div>

          {/* Description */}
          <div className="mt-5 space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Why it&apos;s a great gift</h2>
            <p className="text-[15px] leading-relaxed text-foreground/90">{product.rationale}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A standout pick in {niche?.label.toLowerCase() ?? "our edit"}
              {product.personas.length > 0 && (
                <>
                  {" "}for the{" "}
                  {product.personas
                    .map((p) => labelOf(PERSONAS, p)?.label.toLowerCase())
                    .filter(Boolean)
                    .join(", ")}
                </>
              )}
              . Consistently well-reviewed, and easy to love straight out of the box.
            </p>
          </div>

          {/* Good for */}
          {product.occasions.length > 0 && (
            <div className="mt-5">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Great for</h2>
              <div className="flex flex-wrap gap-2">
                {product.occasions.map((o) => {
                  const meta = labelOf(DISCOVER_OCCASIONS, o);
                  return (
                    <span key={o} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap">
                      {meta?.emoji} {meta?.label ?? o}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Buy */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a
              href={buyUrl}
              target="_blank"
              rel="noopener noreferrer nofollow sponsored"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm sm:text-base font-bold text-primary-foreground shadow-sm shadow-primary/25 transition-opacity hover:opacity-90 whitespace-nowrap"
            >
              <ShoppingBag className="h-5 w-5" />
              {isAmazon ? "Buy from Amazon" : "Buy now"}
              <ExternalLink className="h-4 w-4 opacity-80" />
            </a>
            {isAmazon && <span className="text-xs text-muted-foreground">Opens Amazon in a new tab</span>}
          </div>

          {/* Videos */}
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">See it in action</h2>
            <div className="flex flex-wrap gap-2">
              {videos.map((v) => (
                <a
                  key={v.label}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors hover:bg-muted whitespace-nowrap"
                >
                  <Play className="h-3.5 w-3.5 text-primary" /> {v.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
