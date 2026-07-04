import Link from "next/link";
import {
  ArrowLeft,
  ShoppingCart,
  Search,
  Play,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Wand2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GiftDetailActions } from "@/components/giftmind/gift-detail-actions";
import { GiftGallery } from "@/components/giftmind/gift-gallery";
import type { GiftCardData } from "@/components/giftmind/gift-card";
import { amazonSearchUrl, googleShoppingUrl, videoLinksFor } from "@/lib/giftmind/media";

const VIBE_LABEL: Record<string, string> = {
  practical: "Practical",
  sentimental: "Sentimental",
  fun: "Fun",
  luxury: "Luxury",
};

export function GiftDetailView({
  gift,
  firstName,
  backHref,
}: {
  gift: GiftCardData;
  firstName: string;
  backHref: string;
}) {
  const query = gift.searchQuery || gift.name;
  const buyUrl = gift.buyUrl || amazonSearchUrl(query);
  const isAmazonBuy = /(^|\.)amazon\./i.test(buyUrl);
  const videos = videoLinksFor(query);

  const priceText = gift.priceText || (gift.estPrice ? `~$${gift.estPrice}` : "Price varies");
  const hasAlts = gift.cheaperAlt || gift.premiumAlt || gift.personalTouch;

  // All scraped product photos, primary first, de-duped (falls back to the
  // single imageUrl for ideas generated before galleries were stored).
  const gallery = Array.from(
    new Set([...(gift.imageUrls ?? []), ...(gift.imageUrl ? [gift.imageUrl] : [])].filter(Boolean)),
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      {/* Back */}
      <Link
        href={backHref as never}
        className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-sm">
          <ArrowLeft className="h-4 w-4" />
        </span>
        Back to ideas for {firstName}
      </Link>

      {/* Product: gallery + info */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Gallery — all the real scraped product photos */}
        <GiftGallery images={gallery} alt={gift.name} />

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
              {gift.type === "experience" ? "Experience" : "Object"}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground whitespace-nowrap">
              {VIBE_LABEL[gift.vibe] ?? gift.vibe}
            </span>
            {gift.splurgeWorthy && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-foreground whitespace-nowrap">
                <Sparkles className="h-3 w-3" /> They&apos;d never buy this
              </span>
            )}
          </div>

          <h1 className="mt-2 font-serif text-xl font-bold leading-tight tracking-tight">{gift.name}</h1>
          <p className="mt-1.5 text-lg font-bold text-primary">{priceText}</p>

          {/* Why it fits */}
          <div className="mt-3 rounded-xl bg-primary/8 p-3">
            <p className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Why it fits {firstName}
            </p>
            <p className="text-[13px] leading-relaxed text-muted-foreground">{gift.reason}</p>
          </div>

          {gift.about && (
            <div className="mt-3">
              <p className="mb-1 text-[13px] font-semibold">About this gift</p>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{gift.about}</p>
            </div>
          )}

          {/* Buy actions */}
          <div className="mt-auto pt-4">
            <div className="flex gap-2">
              <a href={buyUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                <Button className="w-full rounded-full">
                  <ShoppingCart className="mr-2 h-4 w-4" /> {isAmazonBuy ? "Buy on Amazon" : "Buy now"}
                </Button>
              </a>
              <a href={googleShoppingUrl(query)} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="rounded-full">
                  <Search className="mr-2 h-4 w-4" /> Compare
                </Button>
              </a>
            </div>
            <div className="mt-2.5">
              <GiftDetailActions id={gift.id} saved={gift.saved} purchased={gift.purchased} trackPrice={gift.trackPrice} />
            </div>
          </div>
        </div>
      </div>

      {/* Alternatives + Videos */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-base font-bold tracking-tight">Alternatives & a personal touch</h2>
          {hasAlts ? (
            <div className="space-y-3">
              {gift.cheaperAlt && (
                <AltRow icon={<ArrowDownRight className="h-4 w-4 text-muted-foreground" />} title="A cheaper take" body={gift.cheaperAlt} />
              )}
              {gift.premiumAlt && (
                <AltRow icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />} title="If you want to splurge" body={gift.premiumAlt} />
              )}
              {gift.personalTouch && (
                <AltRow icon={<Wand2 className="h-4 w-4 text-accent" />} title="Make it personal" body={gift.personalTouch} accent />
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No alternatives for this one.</p>
          )}
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-base font-bold tracking-tight">See it in action</h2>
          <div className="space-y-2">
            {videos.map((v) => (
              <a
                key={v.label}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-xl bg-secondary/50 p-2.5 transition-colors hover:bg-secondary"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </span>
                <span>
                  <span className="block text-[13px] font-medium">{v.label}</span>
                  <span className="block text-[11px] text-muted-foreground">Search YouTube</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function AltRow({ icon, title, body, accent }: { icon: React.ReactNode; title: string; body: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-xl p-3", accent ? "bg-accent/5 ring-1 ring-accent/20" : "bg-secondary/50")}>
      <p className="mb-1 flex items-center gap-1.5 text-[13px] font-semibold">
        {icon} {title}
      </p>
      <p className="text-[13px] text-muted-foreground">{body}</p>
    </div>
  );
}
