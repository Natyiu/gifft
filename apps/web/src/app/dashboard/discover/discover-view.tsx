"use client";

import { useQuery } from "@tanstack/react-query";

import { getDiscoverData } from "@/lib/loaders/discover";
import { DiscoverFeed } from "@/components/giftmind/discover-feed";

export function DiscoverView() {
  const { data } = useQuery({ queryKey: ["discover"], queryFn: () => getDiscoverData() });

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  return <DiscoverFeed amazonTag={data.amazonTag} people={data.people} media={data.media} />;
}
