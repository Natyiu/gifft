"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, ChevronDown, X, SlidersHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/giftmind/person-avatar";
import { GiftCard, type GiftCardData } from "@/components/giftmind/gift-card";

type Header = {
  runId: string;
  profileId: string;
  profileName: string;
  profileColor: string | null;
  occasionEmoji: string;
  occasionLabel: string;
  toneLabel: string;
  budgetMin: number;
  budgetMax: number;
  neverBuyFilter: boolean;
  usedFallback: boolean;
};

const TYPES = [
  { key: "all", label: "All ideas" },
  { key: "object", label: "Things" },
  { key: "experience", label: "Experiences" },
] as const;

const VIBES = [
  { key: "practical", label: "Practical" },
  { key: "sentimental", label: "Sentimental" },
  { key: "fun", label: "Fun" },
  { key: "luxury", label: "Luxury" },
] as const;

const SORTS = [
  { key: "recommended", label: "Recommended" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
] as const;

type TypeKey = (typeof TYPES)[number]["key"];
type SortKey = (typeof SORTS)[number]["key"];

const VIBE_LABEL: Record<string, string> = Object.fromEntries(VIBES.map((v) => [v.key, v.label]));

export function ResultsShop({ gifts, header }: { gifts: GiftCardData[]; header: Header }) {
  const [type, setType] = useState<TypeKey>("all");
  const [vibes, setVibes] = useState<Set<string>>(new Set());
  const [splurgeOnly, setSplurgeOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recommended");

  const firstName = header.profileName.split(" ")[0];

  function toggleVibe(v: string) {
    setVibes((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }

  function clearAll() {
    setType("all");
    setVibes(new Set());
    setSplurgeOnly(false);
    setSavedOnly(false);
  }

  const filterCount =
    (type !== "all" ? 1 : 0) + vibes.size + (splurgeOnly ? 1 : 0) + (savedOnly ? 1 : 0);

  const list = useMemo(() => {
    let out = gifts.filter((g) => {
      if (type !== "all" && g.type !== type) return false;
      if (vibes.size > 0 && !vibes.has(g.vibe)) return false;
      if (splurgeOnly && !g.splurgeWorthy) return false;
      if (savedOnly && !g.saved) return false;
      return true;
    });
    if (sort !== "recommended") {
      out = [...out].sort((a, b) => {
        const pa = a.estPrice ?? Number.POSITIVE_INFINITY;
        const pb = b.estPrice ?? Number.POSITIVE_INFINITY;
        return sort === "price-asc" ? pa - pb : pb - pa;
      });
    }
    return out;
  }, [gifts, type, vibes, splurgeOnly, savedOnly, sort]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/people/${header.profileId}` as never}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card text-foreground/70 shadow-sm transition-colors hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <PersonAvatar name={header.profileName} color={header.profileColor} size="md" />
          <div>
            <h1 className="text-xl font-bold leading-tight tracking-tight">
              {gifts.length} gift ideas for {firstName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {header.occasionEmoji} {header.occasionLabel} · {header.toneLabel} · ${header.budgetMin}–${header.budgetMax}
              {header.neverBuyFilter ? " · splurge mode" : ""}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/people/${header.profileId}` as never}>
          <Button variant="outline" size="sm" className="rounded-full">
            <RefreshCw className="mr-1 h-3.5 w-3.5" /> New search
          </Button>
        </Link>
      </div>

      {/* Active filter chips */}
      {filterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {type !== "all" && (
            <Chip onClear={() => setType("all")}>{TYPES.find((t) => t.key === type)!.label}</Chip>
          )}
          {[...vibes].map((v) => (
            <Chip key={v} onClear={() => toggleVibe(v)}>
              {VIBE_LABEL[v] ?? v}
            </Chip>
          ))}
          {splurgeOnly && <Chip onClear={() => setSplurgeOnly(false)}>Splurge-worthy</Chip>}
          {savedOnly && <Chip onClear={() => setSavedOnly(false)}>Saved</Chip>}
          <button
            onClick={clearAll}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Body: filters left, grid right */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,232px)_minmax(0,1fr)]">
        {/* Filters */}
        <aside className="h-fit rounded-[24px] bg-card p-5 shadow-sm lg:sticky lg:top-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2 text-base font-bold">
              <SlidersHorizontal className="h-4 w-4 text-primary" /> Filter
            </span>
            {filterCount > 0 && (
              <button onClick={clearAll} className="text-xs font-medium text-primary hover:underline">
                Clear all
              </button>
            )}
          </div>

          <FilterGroup label="Type">
            {TYPES.map((t) => (
              <Radio key={t.key} checked={type === t.key} onChange={() => setType(t.key)} label={t.label} />
            ))}
          </FilterGroup>

          <FilterGroup label="Vibe">
            {VIBES.map((v) => (
              <Check key={v.key} checked={vibes.has(v.key)} onChange={() => toggleVibe(v.key)} label={v.label} />
            ))}
          </FilterGroup>

          <FilterGroup label="More" last>
            <Check checked={splurgeOnly} onChange={() => setSplurgeOnly((v) => !v)} label="Splurge-worthy" />
            <Check checked={savedOnly} onChange={() => setSavedOnly((v) => !v)} label="Saved only" />
          </FilterGroup>
        </aside>

        {/* Grid */}
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{list.length}</span>{" "}
              {list.length === 1 ? "idea" : "ideas"}
            </p>
            <SortSelect value={sort} onChange={setSort} />
          </div>

          {list.length === 0 ? (
            <div className="rounded-[24px] border-2 border-dashed border-border p-12 text-center">
              <p className="text-sm text-muted-foreground">No ideas match these filters.</p>
              <button onClick={clearAll} className="mt-3 text-sm font-semibold text-primary hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((g, i) => (
                <GiftCard key={g.id} gift={g} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-card px-3 py-1.5 text-xs sm:text-sm font-medium shadow-sm">
      {children}
      <button onClick={onClear} className="text-muted-foreground hover:text-foreground" aria-label="Remove filter">
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function FilterGroup({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn("py-4", !last && "border-b border-border")}>
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Radio({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button onClick={onChange} className="flex w-full items-center gap-2.5 py-1 text-left">
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          checked ? "border-primary" : "border-border",
        )}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <span className={cn("text-sm", checked ? "font-semibold text-foreground" : "text-foreground/80")}>{label}</span>
    </button>
  );
}

function Check({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button onClick={onChange} className="flex w-full items-center gap-2.5 py-1 text-left">
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={cn("text-sm", checked ? "font-semibold text-foreground" : "text-foreground/80")}>{label}</span>
    </button>
  );
}

function SortSelect({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        className="appearance-none rounded-full bg-card py-2 pl-4 pr-9 text-sm font-medium text-foreground shadow-sm outline-none"
      >
        {SORTS.map((s) => (
          <option key={s.key} value={s.key}>
            Sort: {s.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
    </div>
  );
}
