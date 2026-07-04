"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Trash2, ExternalLink, ImageOff, Link2 } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addWishlistItem, deleteWishlistItem, type WishlistItemRow } from "@/lib/actions/giftmind";

export function WishlistProducts({ items: initial }: { items: WishlistItemRow[] }) {
  const [items, setItems] = useState<WishlistItemRow[]>(initial);
  const [url, setUrl] = useState("");
  const [pending, start] = useTransition();

  function add() {
    const value = url.trim();
    if (!value) return;
    start(async () => {
      try {
        const item = await addWishlistItem(value);
        setItems((prev) => [item, ...prev]);
        setUrl("");
        toast.success("Added to your wishlist");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't add that link");
      }
    });
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    deleteWishlistItem(id).catch(() => toast.error("Couldn't remove that"));
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-serif text-lg font-semibold">Add products by link</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste a link to anything you want — we&apos;ll pull in the photo, name, and price and save it here.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !pending && add()}
            placeholder="Paste a product link (https://…)"
            className="pl-9"
            inputMode="url"
          />
        </div>
        <Button onClick={add} disabled={pending} className="whitespace-nowrap rounded-full">
          {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
          {pending ? "Fetching…" : "Add"}
        </Button>
      </div>

      {items.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="group relative flex flex-col rounded-2xl border border-border bg-card p-2 shadow-sm transition-shadow hover:shadow-md sm:p-3">
              <a href={item.buyUrl ?? item.url} target="_blank" rel="noopener noreferrer" className="relative block overflow-hidden rounded-xl bg-muted">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <span className="flex aspect-[4/3] w-full items-center justify-center text-muted-foreground/40">
                    <ImageOff className="h-8 w-8" />
                  </span>
                )}
              </a>
              <button
                onClick={() => remove(item.id)}
                className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-opacity hover:text-red-500 group-hover:opacity-100"
                title="Remove"
              >
                <Trash2 className="h-3 w-3" />
              </button>

              <a
                href={item.buyUrl ?? item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2.5 line-clamp-2 text-[15px] font-bold leading-tight text-foreground hover:text-primary"
              >
                {item.title}
              </a>
              <div className="mt-2 flex items-end justify-between gap-2">
                <span className="text-[15px] font-bold text-primary">{item.priceText || "—"}</span>
                <a
                  href={item.buyUrl ?? item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  {item.source === "amazon" ? "Amazon" : item.source === "etsy" ? "Etsy" : "Open"}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
