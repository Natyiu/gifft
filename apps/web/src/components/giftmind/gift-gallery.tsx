"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Product gallery for the gift detail page: a large main image plus a row of
 * thumbnails (all the photos scraped from the merchant). Clicking a thumbnail
 * swaps the main image so shoppers can see the product from every angle.
 */
export function GiftGallery({ images, alt }: { images: string[]; alt: string }) {
  const gallery = images.filter(Boolean);
  const [active, setActive] = useState(0);

  if (gallery.length === 0) {
    return (
      <div className="flex aspect-[5/4] w-full items-center justify-center rounded-2xl bg-muted text-muted-foreground/50 shadow-sm">
        <ImageOff className="h-10 w-10" />
      </div>
    );
  }

  const current = gallery[Math.min(active, gallery.length - 1)];

  return (
    <div className="flex flex-col gap-2.5">
      <div className="h-fit overflow-hidden rounded-2xl bg-card shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current} alt={alt} className="aspect-[5/4] w-full object-cover" />
      </div>

      {gallery.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {gallery.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "overflow-hidden rounded-xl bg-card ring-2 transition-all",
                i === active ? "ring-primary" : "ring-transparent hover:ring-border",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${alt} — view ${i + 1}`}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
