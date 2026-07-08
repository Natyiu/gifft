"use client";

import { useState, useTransition } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { setGiftSaved, setGiftTracked, markGiftPurchased, unmarkGiftPurchased } from "@/lib/actions/giftmind";

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
      className="gift-card-in group relative flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
      style={{ animationDelay: `${Math.min(index, 14) * 55}ms` }}
    >
      {/* Header: type/vibe + price (image-free info card) */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
            {gift.type === "experience" ? "Experience" : "Object"}
          </span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
            {VIBE_LABEL[gift.vibe] ?? gift.vibe}
          </span>
        </div>
        <span className="shrink-0 text-sm font-bold text-primary whitespace-nowrap">
          {gift.priceText || (gift.estPrice ? `~$${gift.estPrice}` : "")}
        </span>
      </div>

      {gift.splurgeWorthy && (
        <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground whitespace-nowrap">
          <Sparkles className="h-3 w-3" /> Never buys this
        </span>
      )}

      <div className="flex flex-1 flex-col">
        <Link href={`/dashboard/gift/${gift.id}` as never} className="mt-2">
          <h3 className="line-clamp-2 font-serif text-[15px] font-bold leading-snug text-foreground hover:text-primary">
            {gift.name}
          </h3>
        </Link>

        <p className="mt-1 line-clamp-3 text-xs leading-snug text-muted-foreground">{gift.reason}</p>

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

        <div className="mt-auto flex items-center gap-1 border-t border-border/60 pt-2.5">
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
