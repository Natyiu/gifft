"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Search,
  Play,
  Sparkles,
  ArrowDownRight,
  ArrowUpRight,
  Wand2,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/giftmind/person-avatar";
import { GiftDetailActions } from "@/components/giftmind/gift-detail-actions";
import type { GiftCardData } from "@/components/giftmind/gift-card";
import {
  productImageUrl,
  amazonSearchUrl,
  googleShoppingUrl,
  videoLinksFor,
} from "@/lib/giftmind/media";

const VIBE_LABEL: Record<string, string> = {
  practical: "Practical",
  sentimental: "Sentimental",
  fun: "Fun",
  luxury: "Luxury",
};

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

const FILTERS = [
  { key: "all", label: "All" },
  { key: "object", label: "Things" },
  { key: "experience", label: "Experiences" },
] as const;

export function ResultsSplit({
  gifts,
  header,
  initialSelectedId,
}: {
  gifts: GiftCardData[];
  header: Header;
  initialSelectedId?: string;
}) {
  const [selectedId, setSelectedId] = useState(initialSelectedId || gifts[0]?.id);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const list = useMemo(
    () => (filter === "all" ? gifts : gifts.filter((g) => g.type === filter)),
    [gifts, filter],
  );
  const selected = gifts.find((g) => g.id === selectedId) ?? gifts[0];
  const firstName = header.profileName.split(" ")[0];

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-8rem)] lg:overflow-hidden">
      {/* Header (fixed) */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
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
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-card p-1 shadow-sm">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-colors",
                  filter === f.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Link href={`/dashboard/people/${header.profileId}` as never}>
            <Button variant="outline" size="sm" className="rounded-full">
              <RefreshCw className="mr-1 h-3.5 w-3.5" /> New search
            </Button>
          </Link>
        </div>
      </div>

      {/* Split (fills remaining height) */}
      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        {/* Left — list (internal scroll) */}
        <div className="space-y-3 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
          {list.map((g) => {
            const active = g.id === selected?.id;
            return (
              <button
                key={g.id}
                onClick={() => setSelectedId(g.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-3xl bg-card p-3 text-left shadow-sm transition-all",
                  active ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-primary/30",
                )}
              >
                <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-secondary/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={productImageUrl(g.searchQuery || g.name, { w: 160, h: 160 })}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-bold leading-snug">{g.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {g.type === "experience" ? "Experience" : "Object"} · {VIBE_LABEL[g.vibe] ?? g.vibe}
                  </span>
                  <span className="mt-0.5 block text-sm font-bold text-primary">
                    {g.priceText || (g.estPrice ? `$${g.estPrice}` : "Price varies")}
                  </span>
                </span>
              </button>
            );
          })}
          {list.length === 0 && (
            <p className="rounded-3xl border-2 border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No {filter === "experience" ? "experiences" : "things"} in this batch.
            </p>
          )}
        </div>

        {/* Right — detail (fits column height) */}
        <div className="min-h-0 lg:h-full">{selected && <DetailPane gift={selected} firstName={firstName} />}</div>
      </div>
    </div>
  );
}

const TABS = ["Overview", "About", "Alternatives", "Videos"] as const;

function DetailPane({ gift, firstName }: { gift: GiftCardData; firstName: string }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  const query = gift.searchQuery || gift.name;
  const buyUrl = gift.buyUrl || amazonSearchUrl(query);
  const videos = videoLinksFor(query);
  const images = [0, 1, 2].map((v) => productImageUrl(query, { w: 900, h: 600, variant: v }));

  return (
    <div key={gift.id} className="flex h-full flex-col overflow-hidden rounded-[32px] bg-card shadow-sm">
      {/* Media (fixed) */}
      <div className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[0]} alt={gift.name} className="h-44 w-full object-cover lg:h-52" />
        <span className="absolute left-4 top-4 whitespace-nowrap rounded-full bg-background/90 px-3 py-1 text-xs sm:text-sm font-bold text-primary shadow-sm backdrop-blur">
          {gift.priceText || (gift.estPrice ? `~$${gift.estPrice}` : "")}
        </span>
        {gift.splurgeWorthy && (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> They&apos;d never buy this
          </span>
        )}
        <div className="absolute inset-x-4 bottom-3">
          <span className="inline-flex max-w-full items-center rounded-2xl bg-background/90 px-4 py-1.5 text-lg font-bold shadow-sm backdrop-blur">
            <span className="truncate">{gift.name}</span>
          </span>
        </div>
      </div>

      {/* Tabs (fixed) */}
      <div className="flex shrink-0 gap-1 border-b border-border px-6 pt-3">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative px-3 pb-3 text-sm font-semibold transition-colors",
              tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
            {tab === t && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
          </button>
        ))}
      </div>

      {/* Tab content (only this scrolls if needed) */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {tab === "Overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Price" value={gift.priceText || (gift.estPrice ? `~$${gift.estPrice}` : "Varies")} />
              <Field label="Type" value={gift.type === "experience" ? "Experience" : "Object"} />
              <Field label="Vibe" value={VIBE_LABEL[gift.vibe] ?? gift.vibe} />
              <Field label="For" value={firstName} />
            </div>
            <div className="rounded-2xl bg-primary/8 p-4">
              <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-accent" /> Why it fits {firstName}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">{gift.reason}</p>
            </div>
          </div>
        )}

        {tab === "About" && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">{gift.about || gift.reason}</p>
            <div className="grid grid-cols-3 gap-3">
              {images.slice(1).map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="aspect-square w-full rounded-2xl object-cover" loading="lazy" />
              ))}
            </div>
          </div>
        )}

        {tab === "Alternatives" && (
          <div className="space-y-3">
            {gift.cheaperAlt && (
              <AltRow icon={<ArrowDownRight className="h-4 w-4 text-muted-foreground" />} title="A cheaper take" body={gift.cheaperAlt} />
            )}
            {gift.premiumAlt && (
              <AltRow icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />} title="If you want to splurge" body={gift.premiumAlt} />
            )}
            {gift.personalTouch && (
              <AltRow icon={<Wand2 className="h-4 w-4 text-accent" />} title="Make it personal" body={gift.personalTouch} accent />
            )}
            {!gift.cheaperAlt && !gift.premiumAlt && !gift.personalTouch && (
              <p className="text-sm text-muted-foreground">No alternatives for this one.</p>
            )}
          </div>
        )}

        {tab === "Videos" && (
          <div className="grid gap-3 sm:grid-cols-3">
            {videos.map((v) => (
              <a
                key={v.label}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-2xl bg-secondary/50 p-4 transition-colors hover:bg-secondary"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Play className="h-4 w-4 fill-current" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{v.label}</span>
                  <span className="block text-xs text-muted-foreground">Search YouTube</span>
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Actions (fixed) */}
      <div className="shrink-0 space-y-2.5 border-t border-border px-6 py-4">
        <div className="flex gap-2.5">
          <a href={buyUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full rounded-full" size="lg">
              <ShoppingCart className="mr-2 h-4 w-4" /> Buy on Amazon
            </Button>
          </a>
          <a href={googleShoppingUrl(query)} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="lg" className="rounded-full">
              <Search className="mr-2 h-4 w-4" /> Compare
            </Button>
          </a>
        </div>
        <GiftDetailActions id={gift.id} saved={gift.saved} purchased={gift.purchased} trackPrice={gift.trackPrice} />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-bold">{value}</p>
    </div>
  );
}

function AltRow({ icon, title, body, accent }: { icon: React.ReactNode; title: string; body: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-2xl p-4", accent ? "bg-accent/5 ring-1 ring-accent/20" : "bg-secondary/50")}>
      <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold">
        {icon} {title}
      </p>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
