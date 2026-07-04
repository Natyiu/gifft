"use client";

import { useState, useTransition } from "react";
import { Heart, Bell, BellRing, Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { setGiftSaved, setGiftTracked, markGiftPurchased, unmarkGiftPurchased } from "@/lib/actions/giftmind";

export function GiftDetailActions({
  id,
  saved: savedInit,
  purchased: purchasedInit,
  trackPrice: trackInit,
}: {
  id: string;
  saved: boolean;
  purchased: boolean;
  trackPrice: boolean;
}) {
  const [saved, setSaved] = useState(savedInit);
  const [tracked, setTracked] = useState(trackInit);
  const [purchased, setPurchased] = useState(purchasedInit);
  const [pending, start] = useTransition();

  function toggleSave() {
    const next = !saved;
    setSaved(next);
    start(async () => {
      try {
        await setGiftSaved(id, next);
        toast.success(next ? "Saved" : "Removed from saved");
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
        await setGiftTracked(id, next);
        toast.success(next ? "We'll watch the price for you" : "Price tracking off");
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
          await markGiftPurchased(id);
          toast.success("Bought — logged in your Gift Vault");
        } else {
          await unmarkGiftPurchased(id);
          toast.success("Removed from your Gift Vault");
        }
      } catch {
        setPurchased(!next);
        toast.error("Couldn't update");
      }
    });
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <ActionButton active={saved} onClick={toggleSave} disabled={pending}>
        <Heart className={cn("h-4 w-4", saved && "fill-current")} />
        {saved ? "Saved" : "Save"}
      </ActionButton>
      <ActionButton active={tracked} onClick={toggleTrack} disabled={pending}>
        {tracked ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        {tracked ? "Tracking" : "Track price"}
      </ActionButton>
      <ActionButton active={purchased} onClick={markBought} disabled={pending}>
        {purchased ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
        {purchased ? "Bought" : "I bought it"}
      </ActionButton>
    </div>
  );
}

function ActionButton({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
