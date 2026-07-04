"use client";

import { useState } from "react";
import { Gift, Send } from "lucide-react";

import { cn } from "@/lib/utils";
import { WishlistProducts } from "@/components/giftmind/wishlist-products";
import { WishlistManager, type ShareRow } from "@/components/giftmind/wishlist-manager";
import { type WishlistItemRow } from "@/lib/actions/giftmind";

export function WishlistTabs({ items, shares }: { items: WishlistItemRow[]; shares: ShareRow[] }) {
  const [tab, setTab] = useState<"products" | "share">("products");

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-full bg-muted p-1">
        <Tab active={tab === "products"} onClick={() => setTab("products")} icon={<Gift className="h-4 w-4" />}>
          My wishlist{items.length ? ` (${items.length})` : ""}
        </Tab>
        <Tab active={tab === "share"} onClick={() => setTab("share")} icon={<Send className="h-4 w-4" />}>
          Ask someone
        </Tab>
      </div>

      {tab === "products" ? <WishlistProducts items={items} /> : <WishlistManager shares={shares} />}
    </div>
  );
}

function Tab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors sm:text-sm whitespace-nowrap",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
