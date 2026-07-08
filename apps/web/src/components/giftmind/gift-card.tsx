"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  Heart,
  Bell,
  BellRing,
  Check,
  ChevronDown,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Wand2,
  ShoppingBag,
  ArrowRight,
  ImageOff,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  setGiftSaved,
  setGiftTracked,
  markGiftPurchased,
  unmarkGiftPurchased,
  resolveGiftMedia,
} from "@/lib/actions/giftmind";

// Throttle how many products we scrape at once across the whole results grid,
// so ideas stream in a few at a time instead of firing 15 scrapes in one burst.
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

export type GiftCardData = {
  id: string;
  name: string;
  reason: string;
  about: string | null;
  searchQuery: string | null;
  buyUrl: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  priceText: string | null;
  productSource: string | null; // null = product photo not yet scraped
  estPrice: number | null;
  type: string;
  vibe: string;
  splurgeWorthy: boolean;
  cheaperAlt: string | null;
  premiumAlt: string | null;
  personalTouch: string | null;
  saved: boolean;
  purchased: boolean;
  trackPrice: boolean;
};

const VIBE_LABEL: Record<string, string> = {
  practical: "Practical",
  sentimental: "Sentimental",
  fun: "Fun",
  luxury: "Luxury",
};

export function GiftCard({ gift, index }: { gift: GiftCardData; index: number }) {
  const [saved, setSaved] = useState(gift.saved);
  const [tracked, setTracked] = useState(gift.trackPrice);
  const [purchased, setPurchased] = useState(gift.purchased);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  // Live product resolution: the idea is persisted without a scraped photo, so
  // each card fetches its real product image + price when it scrolls into view.
  // `productSource` is set once resolved, so re-renders/old runs don't re-scrape.
  const [images, setImages] = useState<string[]>(
    gift.imageUrls?.length ? gift.imageUrls : gift.imageUrl ? [gift.imageUrl] : [],
  );
  const [imgIdx, setImgIdx] = useState(0);
  const [priceText, setPriceText] = useState<string | null>(gift.priceText);
  const [resolved, setResolved] = useState(gift.productSource != null);
  const cardRef = useRef<HTMLElement>(null);
  // Show the next candidate photo if one fails to load (hotlink-blocked etc.),
  // falling back to the placeholder only once every candidate is exhausted.
  const currentImage = images[imgIdx] ?? null;

  useEffect(() => {
    if (resolved) return;
    const el = cardRef.current;
    if (!el) return;
    let done = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (done || !entries.some((e) => e.isIntersecting)) return;
        done = true;
        io.disconnect();
        gate(() => resolveGiftMedia(gift.id))
          .then((m) => {
            const list = m.imageUrls?.length ? m.imageUrls : m.imageUrl ? [m.imageUrl] : [];
            setImages(list);
            setImgIdx(0);
            if (m.priceText) setPriceText(m.priceText);
          })
          .catch(() => {})
          .finally(() => setResolved(true));
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [resolved, gift.id]);

  function toggleSave() {
    const next = !saved;
    setSaved(next);
    start(async () => {
      try {
        await setGiftSaved(gift.id, next);
        toast.success(next ? "Saved to this person's ideas" : "Removed from saved");
      } catch {
        setSaved(!next);
        toast.error("Couldn't save right now");
      }
    });
  }

  function toggleTrack() {
    const next = !tracked;
    setTracked(next);
    start(async () => {
      try {
        await setGiftTracked(gift.id, next);
        toast.success(next ? "We'll watch the price and tell you if it drops" : "Price tracking off");
      } catch {
        setTracked(!next);
        toast.error("Couldn't update tracking");
      }
    });
  }

  function markBought() {
    const next = !purchased;
    setPurchased(next);
    start(async () => {
      try {
        if (next) {
          await markGiftPurchased(gift.id);
          toast.success("Bought — logged in your Gift Vault");
        } else {
          await unmarkGiftPurchased(gift.id);
          toast.success("Removed from your Gift Vault");
        }
      } catch {
        setPurchased(!next);
        toast.error("Couldn't update");
      }
    });
  }

  return (
    <article
      ref={cardRef}
      className="gift-card-in group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
      style={{ animationDelay: `${Math.min(index, 14) * 55}ms` }}
    >
      {/* Product image — streams in live once the card resolves its product */}
      <Link href={`/dashboard/gift/${gift.id}` as never} className="relative block aspect-[4/3] overflow-hidden bg-muted">
        {currentImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentImage}
            alt={gift.name}
            loading="lazy"
            onError={() => setImgIdx((i) => i + 1)}
            className="gift-card-in h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : resolved ? (
          <span className="flex h-full w-full items-center justify-center text-muted-foreground/50">
            <ImageOff className="h-7 w-7" />
          </span>
        ) : (
          <span className="skeleton-shimmer absolute inset-0 block" aria-hidden />
        )}
        {resolved && (
          <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2 py-0.5 text-xs font-semibold text-primary shadow-sm backdrop-blur whitespace-nowrap">
            {priceText || (gift.estPrice ? `~$${gift.estPrice}` : "")}
          </span>
        )}
        {resolved && gift.splurgeWorthy && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground shadow-sm whitespace-nowrap">
            <Sparkles className="h-3 w-3" /> Never buys this
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex flex-wrap items-center gap-1">
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
            {gift.type === "experience" ? "Experience" : "Object"}
          </span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
            {VIBE_LABEL[gift.vibe] ?? gift.vibe}
          </span>
        </div>

        <Link href={`/dashboard/gift/${gift.id}` as never} className="mt-1.5">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground hover:text-primary">
            {gift.name}
          </h3>
        </Link>

        <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">{gift.reason}</p>

        {(gift.cheaperAlt || gift.premiumAlt || gift.personalTouch) && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="mt-2 inline-flex items-center gap-1 self-start text-[11px] font-medium text-primary hover:underline"
          >
            {open ? "Hide" : "Alternatives & a personal touch"}
            <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
          </button>
        )}

        {open && (
          <div className="mt-2 space-y-2 rounded-xl bg-muted/50 p-2.5 text-xs">
            {gift.cheaperAlt && (
              <div className="flex gap-2">
                <ArrowDownRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p>
                  <span className="font-medium text-foreground">Cheaper: </span>
                  <span className="text-muted-foreground">{gift.cheaperAlt}</span>
                </p>
              </div>
            )}
            {gift.premiumAlt && (
              <div className="flex gap-2">
                <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p>
                  <span className="font-medium text-foreground">More premium: </span>
                  <span className="text-muted-foreground">{gift.premiumAlt}</span>
                </p>
              </div>
            )}
            {gift.personalTouch && (
              <div className="flex gap-2">
                <Wand2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <p>
                  <span className="font-medium text-foreground">Make it personal: </span>
                  <span className="text-muted-foreground">{gift.personalTouch}</span>
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center gap-1 border-t border-border/60 pt-2.5">
          <Link
            href={`/dashboard/gift/${gift.id}` as never}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground transition-opacity hover:opacity-90 whitespace-nowrap"
          >
            View <ArrowRight className="h-3 w-3" />
          </Link>
          <div className="flex-1" />
          <IconToggle active={saved} onClick={toggleSave} disabled={pending} title={saved ? "Saved" : "Save idea"}>
            <Heart className={cn("h-3.5 w-3.5", saved && "fill-current")} />
          </IconToggle>
          <IconToggle active={tracked} onClick={toggleTrack} disabled={pending} title="Track the price">
            {tracked ? <BellRing className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
          </IconToggle>
          <button
            type="button"
            onClick={markBought}
            disabled={pending}
            title={purchased ? "Bought — tap to undo" : "I bought this"}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition-colors",
              purchased ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {purchased ? <Check className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </article>
  );
}

function IconToggle({
  active,
  onClick,
  disabled,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors",
        active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
