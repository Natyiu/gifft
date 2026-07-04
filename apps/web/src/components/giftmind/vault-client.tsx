"use client";

import { useState, useMemo, useTransition } from "react";
import { Search, Plus, Trash2, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PersonAvatar } from "@/components/giftmind/person-avatar";
import { addVaultEntry, deleteVaultEntry } from "@/lib/actions/giftmind";
import { OCCASIONS, REACTIONS } from "@/lib/giftmind/constants";

export type VaultRow = {
  id: string;
  title: string;
  profileId: string;
  profileName: string;
  occasion: string | null;
  year: number | null;
  direction: string;
  source: string | null;
  reaction: string | null;
  priceText: string | null;
  notes: string | null;
  imageUrl: string | null;
  buyUrl: string | null;
};

export function VaultClient({
  entries,
  profiles,
}: {
  entries: VaultRow[];
  profiles: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) =>
      [e.title, e.profileName, e.occasion, e.source, e.notes, e.year?.toString()]
        .filter(Boolean)
        .some((v) => v!.toString().toLowerCase().includes(q)),
    );
  }, [entries, query]);

  function remove(id: string) {
    start(async () => {
      try {
        await deleteVaultEntry(id);
        toast.success("Removed from the vault");
      } catch {
        toast.error("Couldn't remove that");
      }
    });
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search gifts, people, years…"
            className="pl-9"
          />
        </div>
        {profiles.length > 0 && (
          <Button onClick={() => setShowForm((v) => !v)} className="rounded-full">
            <Plus className="mr-1 h-4 w-4" /> Log a gift
          </Button>
        )}
      </div>

      {showForm && profiles.length > 0 && (
        <AddForm
          profiles={profiles}
          onDone={() => setShowForm(false)}
          pending={pending}
          start={start}
        />
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          {entries.length === 0
            ? "Your vault is empty. Every gift you give or receive can live here — searchable forever."
            : "Nothing matches that search."}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
            >
              {e.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={e.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-border"
                />
              ) : (
                <PersonAvatar name={e.profileName} size="sm" />
              )}
              <div className="min-w-0 flex-1">
                {e.buyUrl ? (
                  <a
                    href={e.buyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm font-medium text-foreground hover:text-primary hover:underline"
                  >
                    {e.title}
                  </a>
                ) : (
                  <p className="truncate text-sm font-medium text-foreground">{e.title}</p>
                )}
                <p className="truncate text-xs text-muted-foreground">
                  {e.profileName}
                  {e.year ? ` · ${e.year}` : ""}
                  {e.occasion ? ` · ${OCCASIONS.find((o) => o.value === e.occasion)?.label ?? e.occasion}` : ""}
                  {e.direction === "received" ? ` · received${e.source ? ` from ${e.source}` : ""}` : ""}
                  {e.reaction && e.reaction !== "unknown" ? ` · ${e.reaction}` : ""}
                  {e.priceText ? ` · ${e.priceText}` : ""}
                </p>
              </div>
              <button
                onClick={() => remove(e.id)}
                disabled={pending}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddForm({
  profiles,
  onDone,
  pending,
  start,
}: {
  profiles: { id: string; name: string }[];
  onDone: () => void;
  pending: boolean;
  start: (cb: () => void) => void;
}) {
  const [profileId, setProfileId] = useState(profiles[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [direction, setDirection] = useState("given");
  const [occasion, setOccasion] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [reaction, setReaction] = useState("loved");
  const [source, setSource] = useState("");
  const [priceText, setPriceText] = useState("");
  const [notes, setNotes] = useState("");

  function save() {
    if (!title.trim()) {
      toast.error("What was the gift?");
      return;
    }
    start(async () => {
      try {
        await addVaultEntry({
          profileId,
          title,
          direction,
          occasion: occasion || null,
          year: year ? Number(year) : null,
          reaction,
          source: source || null,
          priceText: priceText || null,
          notes: notes || null,
        });
        toast.success("Logged in the vault");
        onDone();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't save");
      }
    });
  }

  const selectCls =
    "h-9 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-muted-foreground">
          Person
          <select value={profileId} onChange={(e) => setProfileId(e.target.value)} className={selectCls + " mt-1"}>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Gift
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. the cast-iron pan" className="mt-1" />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Given or received
          <select value={direction} onChange={(e) => setDirection(e.target.value)} className={selectCls + " mt-1"}>
            <option value="given">I gave it</option>
            <option value="received">They received it (from someone)</option>
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Occasion
          <select value={occasion} onChange={(e) => setOccasion(e.target.value)} className={selectCls + " mt-1"}>
            <option value="">—</option>
            {OCCASIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Year
          <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="mt-1" />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          How it landed
          <select value={reaction} onChange={(e) => setReaction(e.target.value)} className={selectCls + " mt-1"}>
            {REACTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>
        {direction === "received" && (
          <label className="text-xs font-medium text-muted-foreground">
            From whom
            <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Aunt Jo" className="mt-1" />
          </label>
        )}
        <label className="text-xs font-medium text-muted-foreground">
          Price
          <Input value={priceText} onChange={(e) => setPriceText(e.target.value)} placeholder="e.g. ~$60" className="mt-1" />
        </label>
        <label className="text-xs font-medium text-muted-foreground sm:col-span-2">
          Notes
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="mt-1" />
        </label>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onDone} disabled={pending}>Cancel</Button>
        <Button size="sm" onClick={save} disabled={pending} className="rounded-full">
          {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Gift className="mr-1 h-4 w-4" />}
          Save to vault
        </Button>
      </div>
    </div>
  );
}
