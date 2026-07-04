"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";

import { GiftCard, type GiftCardData } from "@/components/giftmind/gift-card";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | "object" | "experience";
type Sort = "curated" | "price-asc" | "price-desc";

const VIBE_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All vibes" },
  { value: "practical", label: "Practical" },
  { value: "sentimental", label: "Sentimental" },
  { value: "fun", label: "Fun" },
  { value: "luxury", label: "Luxury" },
];

export function ResultsGrid({ gifts }: { gifts: GiftCardData[] }) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [vibe, setVibe] = useState("all");
  const [splurgeOnly, setSplurgeOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("curated");

  const filtered = useMemo(() => {
    let list = gifts.slice();
    if (typeFilter !== "all") list = list.filter((g) => g.type === typeFilter);
    if (vibe !== "all") list = list.filter((g) => g.vibe === vibe);
    if (splurgeOnly) list = list.filter((g) => g.splurgeWorthy);
    if (sort === "price-asc") list.sort((a, b) => (a.estPrice ?? 0) - (b.estPrice ?? 0));
    if (sort === "price-desc") list.sort((a, b) => (b.estPrice ?? 0) - (a.estPrice ?? 0));
    return list;
  }, [gifts, typeFilter, vibe, splurgeOnly, sort]);

  return (
    <div>
      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Segmented
          value={typeFilter}
          onChange={(v) => setTypeFilter(v as TypeFilter)}
          options={[
            { value: "all", label: "Everything" },
            { value: "object", label: "Objects" },
            { value: "experience", label: "Experiences" },
          ]}
        />
        <select
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          className="h-8 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/30"
        >
          {VIBE_FILTERS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="h-8 rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-ring/30"
        >
          <option value="curated">GiftMind&apos;s order</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
        <button
          type="button"
          onClick={() => setSplurgeOnly((v) => !v)}
          className={cn(
            "inline-flex h-8 items-center gap-1 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors",
            splurgeOnly
              ? "border-accent bg-accent/15 text-accent"
              : "border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          <Sparkles className="h-3.5 w-3.5" /> They&apos;d never buy this
        </button>
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "idea" : "ideas"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
          No ideas match those filters. Loosen them to see more.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((g, i) => (
            <GiftCard key={g.id} gift={g} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors",
            value === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
