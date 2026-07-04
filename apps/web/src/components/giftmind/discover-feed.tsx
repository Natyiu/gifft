"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal, Users, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { PersonAvatar } from "@/components/giftmind/person-avatar";
import { DiscoverCard } from "@/components/giftmind/discover-card";
import {
  DISCOVER_OCCASIONS,
  PERSONAS,
  PRICE_RANGES,
  NICHES,
  DISCOVER_PRODUCTS,
  editorialFeed,
  filterDiscover,
  matchesPerson,
  type OptionDef,
} from "@/lib/giftmind/discover";

export type PersonPick = {
  id: string;
  name: string;
  color: string | null;
  relationship: string | null;
  personas: string[];
  occasions: string[];
};

type Layer = "occasions" | "personas" | "priceRanges" | "niches";

const SORTS = [
  { key: "recommended", label: "Recommended" },
  { key: "rating", label: "Top rated" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

export type DiscoverMediaMap = Record<string, { imageUrl: string | null }>;

export function DiscoverFeed({
  amazonTag,
  people = [],
  media = {},
}: {
  amazonTag?: string | null;
  people?: PersonPick[];
  media?: DiscoverMediaMap;
}) {
  const [selectedPeople, setSelectedPeople] = useState<Set<string>>(new Set());
  const [occasions, setOccasions] = useState<Set<string>>(new Set());
  const [personas, setPersonas] = useState<Set<string>>(new Set());
  const [priceRanges, setPriceRanges] = useState<Set<string>>(new Set());
  const [niches, setNiches] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortKey>("recommended");
  const [sheet, setSheet] = useState<null | "people" | "filters">(null);
  const [query, setQuery] = useState("");

  const setters: Record<Layer, React.Dispatch<React.SetStateAction<Set<string>>>> = {
    occasions: setOccasions,
    personas: setPersonas,
    priceRanges: setPriceRanges,
    niches: setNiches,
  };

  function toggle(layer: Layer, value: string) {
    setters[layer]((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function togglePerson(id: string) {
    setSelectedPeople((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearAll() {
    setSelectedPeople(new Set());
    setOccasions(new Set());
    setPersonas(new Set());
    setPriceRanges(new Set());
    setNiches(new Set());
    setQuery("");
  }

  const layerCount = occasions.size + personas.size + priceRanges.size + niches.size;
  const activeCount = layerCount + selectedPeople.size;

  const chosenPeople = useMemo(
    () => people.filter((p) => selectedPeople.has(p.id)),
    [people, selectedPeople],
  );
  const peopleLabel = useMemo(
    () => chosenPeople.map((p) => p.name.split(" ")[0]).join(", "),
    [chosenPeople],
  );

  // Feed logic:
  //  · nothing selected → the mixed editorial edit
  //  · people selected  → only gifts that suit any chosen person, then narrowed
  //    by the four filter layers
  //  · filters only      → the full catalog narrowed by the layers
  const list = useMemo(() => {
    const layerFilters = {
      occasions: [...occasions],
      personas: [...personas],
      priceRanges: [...priceRanges],
      niches: [...niches],
    };

    let base;
    if (selectedPeople.size === 0 && layerCount === 0) {
      base = editorialFeed();
    } else {
      const start =
        chosenPeople.length > 0
          ? DISCOVER_PRODUCTS.filter((prod) =>
              chosenPeople.some((person) => matchesPerson(prod, person.personas, person.occasions)),
            )
          : DISCOVER_PRODUCTS;
      base = filterDiscover(start, layerFilters);
    }

    const q = query.trim().toLowerCase();
    if (q) {
      base = base.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.rationale.toLowerCase().includes(q) ||
          p.niche.toLowerCase().includes(q),
      );
    }

    return [...base].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating || b.reviews - a.reviews;
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      return b.rating - a.rating || b.reviews - a.reviews; // recommended
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chosenPeople, layerCount, occasions, personas, priceRanges, niches, sort, query]);

  const filtersBody = (
    <>
      <Group label="Occasion" count={occasions.size}>
        <CheckList options={DISCOVER_OCCASIONS} active={occasions} onToggle={(v) => toggle("occasions", v)} />
      </Group>
      <Group label="Persona" count={personas.size}>
        <CheckList options={PERSONAS} active={personas} onToggle={(v) => toggle("personas", v)} />
      </Group>
      <Group label="Price" count={priceRanges.size}>
        <CheckList
          options={PRICE_RANGES.map((r) => ({ value: r.value, label: r.label }))}
          active={priceRanges}
          onToggle={(v) => toggle("priceRanges", v)}
        />
      </Group>
      <Group label="Category" count={niches.size} last>
        <CheckList options={NICHES} active={niches} onToggle={(v) => toggle("niches", v)} />
      </Group>
    </>
  );

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100vh-8rem)] lg:gap-5 lg:overflow-hidden">
      {/* Editorial masthead */}
      <div className="lg:shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary/80 sm:text-[11px]">The Gifft Edit</p>
        <h1 className="mt-1 font-serif text-xl font-bold tracking-tight text-foreground sm:text-2xl md:text-3xl">
          Discover something worth giving
        </h1>
        <p className="mt-1.5 hidden max-w-xl text-[13.5px] leading-relaxed text-muted-foreground sm:block">
          A hand-picked field guide to gifts people actually love — pick who you&apos;re shopping for, or filter by the
          moment, budget, or a category that catches your eye.
        </p>
      </div>

      {/* Search products */}
      <div className="relative lg:shrink-0">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search gifts by name or category…"
          className="w-full rounded-full border border-border bg-card py-2.5 pl-11 pr-10 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus:border-primary/40"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Mobile control bar — People + Filters side by side, opens as sheets */}
      <div className="flex gap-2 lg:hidden">
        {people.length > 0 && (
          <MobileBarButton
            icon={<Users className="h-4 w-4 text-primary" />}
            label="People"
            count={selectedPeople.size}
            onClick={() => setSheet("people")}
          />
        )}
        <MobileBarButton
          icon={<SlidersHorizontal className="h-4 w-4 text-primary" />}
          label="Filters"
          count={layerCount}
          onClick={() => setSheet("filters")}
        />
      </div>

      {/* Sidebar (your people + filters) + grid — same layout as the Shop page */}
      <div className="grid gap-6 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,232px)_minmax(0,1fr)]">
        {/* Left column — desktop only; on mobile the sheets take over */}
        <div className="hidden flex-col gap-4 lg:flex lg:h-full lg:min-h-0">
          {/* Based on your people — stays put; pick people to tailor the feed */}
          {people.length > 0 && (
            <CollapsePanel
              className="bg-primary/6 lg:shrink-0"
              icon={<Users className="h-4 w-4 text-primary" />}
              title="Based on your people"
              count={selectedPeople.size}
            >
              <p className="mb-2 text-[11px] leading-snug text-muted-foreground">
                Select who you&apos;re shopping for and we&apos;ll match gifts to them.
              </p>
              <PeopleList people={people} selected={selectedPeople} onToggle={togglePerson} />
            </CollapsePanel>
          )}

          {/* Filters — the only part that scrolls (on its own thin scrollbar) */}
          <aside className="thin-scrollbar rounded-[24px] bg-card p-5 shadow-sm lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain">
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-2 text-base font-bold">
                <SlidersHorizontal className="h-4 w-4 text-primary" /> Filter
              </span>
              {activeCount > 0 && (
                <button onClick={clearAll} className="text-xs font-medium text-primary hover:underline">
                  Clear all
                </button>
              )}
            </div>
            {filtersBody}
          </aside>
        </div>

        {/* Grid — only this column's products scroll */}
        <div className="lg:flex lg:h-full lg:min-h-0 lg:flex-col">
          <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4 lg:shrink-0">
            <p className="text-sm text-muted-foreground">
              {chosenPeople.length > 0 ? (
                <>
                  <span className="font-semibold text-foreground">{list.length}</span>{" "}
                  {list.length === 1 ? "gift" : "gifts"} for{" "}
                  <span className="font-semibold text-primary">{peopleLabel}</span>
                </>
              ) : activeCount === 0 ? (
                <>
                  Today&apos;s edit · <span className="font-semibold text-foreground">{list.length}</span> universally
                  giftable picks
                </>
              ) : (
                <>
                  Showing <span className="font-semibold text-foreground">{list.length}</span>{" "}
                  {list.length === 1 ? "gift" : "gifts"}
                </>
              )}
            </p>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="appearance-none rounded-full bg-card py-2 pl-4 pr-9 text-sm font-medium shadow-sm outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key}>
                    Sort: {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
            </div>
          </div>

          <div className="thin-scrollbar lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
            {list.length === 0 ? (
              <div className="rounded-[24px] border-2 border-dashed border-border p-12 text-center">
                <p className="text-sm text-muted-foreground">Nothing matches all of those at once — try loosening a filter.</p>
                <button onClick={clearAll} className="mt-3 text-sm font-semibold text-primary hover:underline">
                  Reset the edit
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-1 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {list.map((p) => (
                  <DiscoverCard key={p.id} product={p} initial={media[p.searchQuery]} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sheets */}
      {sheet === "people" && (
        <MobileSheet title="Based on your people" onClose={() => setSheet(null)}>
          <p className="mb-3 text-[13px] leading-snug text-muted-foreground">
            Select who you&apos;re shopping for and we&apos;ll match gifts to them.
          </p>
          <PeopleList people={people} selected={selectedPeople} onToggle={togglePerson} />
          <SheetFooter count={list.length} onClear={selectedPeople.size ? () => setSelectedPeople(new Set()) : undefined} onDone={() => setSheet(null)} />
        </MobileSheet>
      )}
      {sheet === "filters" && (
        <MobileSheet title="Filters" onClose={() => setSheet(null)}>
          {filtersBody}
          <SheetFooter count={list.length} onClear={activeCount ? clearAll : undefined} onDone={() => setSheet(null)} />
        </MobileSheet>
      )}
    </div>
  );
}

/** A compact button in the mobile control bar that opens a sheet. */
function MobileBarButton({
  icon,
  label,
  count,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-xs font-semibold shadow-sm sm:text-sm whitespace-nowrap"
    >
      {icon}
      {label}
      {count > 0 && (
        <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold leading-4 text-primary-foreground">{count}</span>
      )}
    </button>
  );
}

/** A bottom sheet used for the mobile People / Filters pickers. */
function MobileSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[82vh] flex-col rounded-t-3xl border-t border-border bg-background pb-[env(safe-area-inset-bottom)] shadow-2xl">
        <div className="shrink-0 px-4 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
          <div className="mb-1 flex items-center justify-between">
            <p className="font-serif text-lg font-semibold">{title}</p>
            <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4">{children}</div>
      </div>
    </div>
  );
}

/** Clear + "Show N gifts" actions pinned under a mobile sheet's content. */
function SheetFooter({ count, onClear, onDone }: { count: number; onClear?: () => void; onDone: () => void }) {
  return (
    <div className="sticky bottom-0 mt-3 flex items-center gap-2 border-t border-border bg-background py-3">
      {onClear && (
        <button onClick={onClear} className="rounded-full border border-border px-4 py-2.5 text-xs font-medium text-muted-foreground sm:text-sm whitespace-nowrap">
          Clear
        </button>
      )}
      <button
        onClick={onDone}
        className="flex-1 rounded-full bg-primary py-2.5 text-xs font-semibold text-primary-foreground sm:text-sm whitespace-nowrap"
      >
        Show {count} {count === 1 ? "gift" : "gifts"}
      </button>
    </div>
  );
}

/** The "Based on your people" checkbox list — shared by desktop panel + mobile sheet. */
function PeopleList({
  people,
  selected,
  onToggle,
}: {
  people: PersonPick[];
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-1">
      {people.map((person) => {
        const on = selected.has(person.id);
        return (
          <button
            key={person.id}
            onClick={() => onToggle(person.id)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors",
              on ? "bg-primary/12" : "hover:bg-primary/8",
            )}
          >
            <PersonAvatar name={person.name} color={person.color} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold leading-tight text-foreground">
                {person.name.split(" ")[0]}
              </span>
              {person.relationship && (
                <span className="block truncate text-[11px] capitalize text-muted-foreground">{person.relationship}</span>
              )}
            </span>
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {on && (
                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** A collapsible sidebar panel (used for the "your people" picker). */
function CollapsePanel({
  title,
  icon,
  count,
  className,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  className?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <aside className={cn("rounded-[24px] p-4 shadow-sm", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold">
          {icon}
          {title}
          {count ? (
            <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold leading-4 text-primary-foreground">
              {count}
            </span>
          ) : null}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-foreground/50 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </aside>
  );
}

function Group({
  label,
  count,
  children,
  last,
  defaultOpen = true,
}: {
  label: string;
  count?: number;
  children: React.ReactNode;
  last?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("py-4", !last && "border-b border-border")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
          {count ? (
            <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold leading-4 text-primary-foreground">
              {count}
            </span>
          ) : null}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-foreground/50 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-2.5">{children}</div>}
    </div>
  );
}

function CheckList({
  options,
  active,
  onToggle,
}: {
  options: OptionDef[];
  active: Set<string>;
  onToggle: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      {options.map((o) => {
        const on = active.has(o.value);
        return (
          <button key={o.value} onClick={() => onToggle(o.value)} className="flex w-full items-center gap-2.5 py-1 text-left">
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {on && (
                <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className={cn("text-sm", on ? "font-semibold text-foreground" : "text-foreground/80")}>
              {o.emoji ? <span className="mr-1">{o.emoji}</span> : null}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
