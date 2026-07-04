"use client";

import { useQuery } from "@tanstack/react-query";
import { Link2 } from "lucide-react";

import { getWishlistData } from "@/lib/loaders/wishlist";
import { WishlistTabs } from "@/components/giftmind/wishlist-tabs";

export function WishlistPageView() {
  const { data } = useQuery({ queryKey: ["wishlist"], queryFn: () => getWishlistData() });

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight">
          <Link2 className="h-6 w-6 text-primary" /> Wishlist
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Save products you want by link, and send a link to let people describe themselves.
        </p>
      </div>

      {data ? (
        <WishlistTabs items={data.itemRows} shares={data.shares} />
      ) : (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      )}
    </div>
  );
}
