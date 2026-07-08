"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  Sparkles,
  Lightbulb,
  ClipboardCheck,
  ShoppingBag,
  Loader2,
  Users,
  Plus,
  Trash2,
  ChevronDown,
  Bell,
  Check,
  History,
  ListPlus,
  X,
  CalendarClock,
  Gift,
} from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { countdownLabel } from "@/lib/giftmind/dates";
import { buildIcs, downloadIcs } from "@/lib/giftmind/ics";
import { PLAN_OCCASIONS, planOccasionMeta } from "@/lib/giftmind/plan-occasions";
import {
  updateOccasionPlan,
  planProfileBirthday,
  generateIdeasFor,
  upsertGiftGroup,
  updateGiftGroup,
  deleteGiftGroup,
  createGiftPlan,
  generatePlanIdeas,
  updateGiftPlan,
  deleteGiftPlan,
  type Contributor,
} from "@/lib/actions/giftmind";
/** Send an unpaid user to the paywall. */
function goPaywall(router: ReturnType<typeof useRouter>) {
  toast("Subscribe to reveal your gift ideas.");
  router.push("/pricing" as never);
}

/** Toast a generation error. */
function handleGenerationError(e: unknown) {
  toast.error(e instanceof Error ? e.message : "Couldn't generate ideas");
}

export type PlannerOccasion = {
  id: string;
  profileId: string;
  profileName: string;
  profileColor: string;
  relationship: string | null;
  type: string;
  emoji: string;
  label: string;
  month: number;
  day: number;
  year: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  notes: string | null;
  giftStatus: string;
  synthetic?: boolean;
};

export type PastGift = {
  title: string;
  occasion: string | null;
  year: number | null;
  priceText: string | null;
  reaction: string | null;
};

export type GroupGift = {
  id: string;
  occasionKey: string;
  profileId: string | null;
  title: string;
  targetAmount: number | null;
  ordered: boolean;
  contributors: Contributor[];
};

export type Person = { id: string; name: string; color: string; relationship: string | null };

export type PlanVM = {
  id: string;
  profileId: string | null;
  recipientName: string;
  occasion: string;
  isGroup: boolean;
  budgetMin: number | null;
  budgetMax: number | null;
  notes: string | null;
  notifyDate: string | null; // yyyy-mm-dd
  status: string;
  runId: string | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 86_400_000;

const STATUSES = [
  { key: "idea", label: "Idea", icon: Lightbulb },
  { key: "planned", label: "Planned", icon: ClipboardCheck },
  { key: "purchased", label: "Purchased", icon: ShoppingBag },
] as const;

const statusLabel = (key: string) => STATUSES.find((s) => s.key === key)?.label ?? key;

function budgetSummary(min: string, max: string): string | null {
  if (min && max) return `$${min}–${max}`;
  if (min) return `$${min}+`;
  if (max) return `up to $${max}`;
  return null;
}

function occurrence(o: PlannerOccasion, viewYear: number): Date {
  const d = new Date(o.year ?? viewYear, o.month, o.day);
  d.setHours(0, 0, 0, 0);
  return d;
}

const firstNameOf = (name: string) => name.split(" ")[0];

function daysToDateStr(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / DAY);
}

function urgencyTone(days: number | null): string {
  if (days === null || days < 0) return "text-muted-foreground";
  if (days <= 3) return "bg-red-500/12 text-red-600 dark:text-red-400";
  if (days <= 14) return "bg-primary/12 text-primary";
  return "bg-muted text-muted-foreground";
}

/** Consistent form field label — matches the profile flow's typography. */
function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <span className="mb-1.5 flex items-baseline gap-2">
      <span className="text-sm font-medium text-foreground">{children}</span>
      {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
    </span>
  );
}

export function PlannerClient({
  occasions,
  pastByProfile,
  groups: initialGroups,
  people,
  plans: initialPlans,
}: {
  occasions: PlannerOccasion[];
  pastByProfile: Record<string, PastGift[]>;
  groups: GroupGift[];
  people: Person[];
  plans: PlanVM[];
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [mode, setMode] = useState<"timeline" | "january">("timeline");
  const [groups, setGroups] = useState<GroupGift[]>(initialGroups);
  const [plans, setPlans] = useState<PlanVM[]>(initialPlans);
  const [adding, setAdding] = useState(false);
  const [filterPerson, setFilterPerson] = useState("all");
  const [filterEvent, setFilterEvent] = useState("all");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yearOccasions = useMemo(
    () =>
      occasions
        .filter((o) => o.year === null || o.year === year)
        .sort((a, b) => a.month - b.month || a.day - b.day),
    [occasions, year],
  );

  const totalPlanned = yearOccasions.reduce((sum, o) => sum + (o.budgetMax ?? o.budgetMin ?? 0), 0);

  const groupFor = (key: string) => groups.find((g) => g.occasionKey === key);
  const addGroup = (g: GroupGift) => setGroups((prev) => [...prev, g]);
  const patchGroup = (id: string, patch: Partial<GroupGift>) =>
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  const removeGroup = (id: string) => setGroups((prev) => prev.filter((g) => g.id !== id));

  const patchPlan = (id: string, patch: Partial<PlanVM>) =>
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removePlan = (id: string) => setPlans((prev) => prev.filter((p) => p.id !== id));

  const planPeople = useMemo(() => [...new Set(plans.map((p) => p.profileId).filter(Boolean))] as string[], [plans]);
  const planEvents = useMemo(() => [...new Set(plans.map((p) => p.occasion))], [plans]);
  const filteredPlans = useMemo(
    () =>
      plans
        .filter((p) => (filterPerson === "all" ? true : p.profileId === filterPerson))
        .filter((p) => (filterEvent === "all" ? true : p.occasion === filterEvent))
        .sort((a, b) => {
          const da = a.notifyDate ? daysToDateStr(a.notifyDate) : Infinity;
          const db = b.notifyDate ? daysToDateStr(b.notifyDate) : Infinity;
          return da - db;
        }),
    [plans, filterPerson, filterEvent],
  );

  function exportCalendar() {
    const ics = buildIcs(
      occasions.map((o) => ({
        uid: o.id,
        title: `${o.emoji} ${o.profileName} — ${o.label}`,
        month: o.month,
        day: o.day,
        year: o.year,
        description: [
          o.budgetMax || o.budgetMin ? `Budget: $${o.budgetMin ?? 0}–$${o.budgetMax ?? o.budgetMin}` : null,
          o.notes ? `Ideas: ${o.notes}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      })),
      now.getFullYear(),
    );
    downloadIcs("gifft-occasions.ics", ics);
    toast.success("Calendar file downloaded — open it to add these to your device calendar");
  }

  const byPerson = useMemo(() => {
    const map = new Map<string, { name: string; color: string; rel: string | null; items: PlannerOccasion[] }>();
    for (const o of yearOccasions) {
      const entry = map.get(o.profileId) ?? { name: o.profileName, color: o.profileColor, rel: o.relationship, items: [] };
      entry.items.push(o);
      map.set(o.profileId, entry);
    }
    return [...map.values()].sort((a, b) => b.items.length - a.items.length);
  }, [yearOccasions]);

  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? "Someone";

  return (
    <div className="flex flex-col gap-6">
      {/* ── Your gift plans ── */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <Gift className="h-4 w-4 text-primary" /> Your gift plans
          </h2>
          <button
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {adding ? <X className="h-4 w-4" /> : <ListPlus className="h-4 w-4" />}
            {adding ? "Close" : "Add plan"}
          </button>
        </div>

        {adding && (
          <AddPlanForm
            people={people}
            onClose={() => setAdding(false)}
            onCreated={(plan, group) => {
              setPlans((prev) => [plan, ...prev]);
              if (group) addGroup(group);
            }}
          />
        )}

        {plans.length > 0 && (
          <div className="mb-3 mt-3 flex flex-wrap items-center gap-2">
            <FilterSelect value={filterPerson} onChange={setFilterPerson} allLabel="All people">
              {planPeople.map((pid) => (
                <option key={pid} value={pid}>
                  {nameOf(pid)}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={filterEvent} onChange={setFilterEvent} allLabel="All events">
              {planEvents.map((ev) => (
                <option key={ev} value={ev}>
                  {planOccasionMeta(ev).label}
                </option>
              ))}
            </FilterSelect>
            {(filterPerson !== "all" || filterEvent !== "all") && (
              <button
                onClick={() => {
                  setFilterPerson("all");
                  setFilterEvent("all");
                }}
                className="text-xs font-medium text-primary hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {plans.length === 0 ? (
          !adding && (
            <p className="rounded-3xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              No plans yet. Click <span className="font-semibold text-foreground">Add plan</span> to plan a gift for an
              event or season — set a budget, a notify date, and generate ideas.
            </p>
          )
        ) : filteredPlans.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No plans match this filter.</p>
        ) : (
          <div className="space-y-2.5">
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                group={groupFor(plan.id)}
                onPatch={patchPlan}
                onRemove={removePlan}
                onAddGroup={addGroup}
                onPatchGroup={patchGroup}
                onRemoveGroup={removeGroup}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Occasion timeline ── */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setYear((y) => y - 1)} className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Previous year">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-xl font-bold tracking-tight tabular-nums">{year}</h2>
            <button onClick={() => setYear((y) => y + 1)} className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Next year">
              <ChevronRight className="h-4 w-4" />
            </button>
            {totalPlanned > 0 && (
              <span className="ml-1 whitespace-nowrap rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                ${totalPlanned.toLocaleString()} planned
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full bg-muted p-0.5">
              <TabButton active={mode === "timeline"} onClick={() => setMode("timeline")}>Timeline</TabButton>
              <TabButton active={mode === "january"} onClick={() => setMode("january")}>January plan</TabButton>
            </div>
            <button
              onClick={exportCalendar}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground/80 transition-colors hover:bg-muted"
              title="Download an .ics to add these to your device calendar"
            >
              <CalendarPlus className="h-3.5 w-3.5" /> Calendar
            </button>
          </div>
        </div>

        {yearOccasions.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
            No birthdays or anniversaries in {year} yet — add them on a person&apos;s profile, or make a plan above.
          </div>
        ) : mode === "january" ? (
          <JanuaryMode people={byPerson} year={year} />
        ) : (
          <div className="space-y-2.5">
            {yearOccasions.map((o) => (
              <OccasionCard
                key={o.id}
                occasion={o}
                days={Math.round((occurrence(o, year).getTime() - today.getTime()) / DAY)}
                past={pastByProfile[o.profileId] ?? []}
                group={groupFor(o.id)}
                onAddGroup={addGroup}
                onPatchGroup={patchGroup}
                onRemoveGroup={removeGroup}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function FilterSelect({
  value,
  onChange,
  allLabel,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none rounded-full bg-muted py-1.5 pl-3 pr-8 text-xs font-medium outline-none"
      >
        <option value="all">{allLabel}</option>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/50" />
    </div>
  );
}

function StatusSegment({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="inline-flex rounded-full bg-muted p-0.5">
      {STATUSES.map((s) => {
        const active = value === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-xs sm:text-sm font-semibold transition-colors",
              active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <s.icon className="h-4 w-4" /> {s.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Add plan form ────────────────────────────────────────────────── */

function AddPlanForm({
  people,
  onClose,
  onCreated,
}: {
  people: Person[];
  onClose: () => void;
  onCreated: (plan: PlanVM, group: GroupGift | null) => void;
}) {
  const router = useRouter();
  const [occasion, setOccasion] = useState("");
  const [recipientId, setRecipientId] = useState(people[0]?.id ?? "other");
  const [recipientName, setRecipientName] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [pending, start] = useTransition();

  const usingSavedPerson = recipientId !== "other";
  const ready = occasion !== "" && (usingSavedPerson || recipientName.trim() !== "");

  function submit(generate: boolean) {
    if (!usingSavedPerson && !recipientName.trim()) return toast.error("Who is this gift for?");
    if (!occasion) return toast.error("Pick an occasion.");
    if (generate && !usingSavedPerson) return toast.error("Pick a saved person to generate ideas.");
    start(async () => {
      try {
        const { plan, group } = await createGiftPlan({
          profileId: usingSavedPerson ? recipientId : null,
          recipientName: usingSavedPerson ? people.find((p) => p.id === recipientId)?.name ?? "" : recipientName.trim(),
          occasion,
          isGroup,
          budgetMin: null,
          budgetMax: null,
          notes: null,
          notifyDate: null,
        });
        onCreated(plan, group);
        if (generate) {
          const result = await generatePlanIdeas(plan.id);
          if ("paymentRequired" in result) {
            goPaywall(router);
            return;
          }
          toast.success("Plan saved with fresh ideas");
          router.push(`/dashboard/results/${result.runId}` as never);
        } else {
          toast.success("Plan saved");
          onClose();
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't save the plan");
      }
    });
  }

  return (
    <div className="mt-3 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">New gift plan</h3>
        <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mb-2 text-sm font-medium text-foreground">Who&apos;s it for?</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {people.map((p) => {
          const active = recipientId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setRecipientId(p.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-colors",
                active ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
              )}
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: p.color }}>
                {p.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{p.name}</span>
                {p.relationship && <span className="block truncate text-xs capitalize text-muted-foreground">{p.relationship}</span>}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => setRecipientId("other")}
          className={cn(
            "flex items-center gap-2.5 rounded-2xl border p-3 text-left transition-colors",
            !usingSavedPerson ? "border-primary bg-primary/10" : "border-border hover:bg-muted",
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Plus className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">Someone else</span>
        </button>
      </div>
      {!usingSavedPerson && (
        <Input autoFocus value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Their name" className="mt-2 h-10 text-sm" />
      )}

      <p className="mb-2 mt-5 text-sm font-medium text-foreground">What&apos;s the occasion?</p>
      <div className="flex flex-wrap gap-2">
        {PLAN_OCCASIONS.map((o) => {
          const active = occasion === o.value;
          return (
            <button
              key={o.value}
              onClick={() => setOccasion(o.value)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors",
                active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted",
              )}
            >
              {o.emoji && <span>{o.emoji}</span>} {o.label}
            </button>
          );
        })}
      </div>

      <p className="mb-2 mt-5 text-sm font-medium text-foreground">Is this a group gift?</p>
      <div className="inline-flex rounded-full border border-border p-1">
        <button
          onClick={() => setIsGroup(false)}
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-colors",
            !isGroup ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Gift className="h-4 w-4" /> Just me
        </button>
        <button
          onClick={() => setIsGroup(true)}
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-colors",
            isGroup ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Users className="h-4 w-4" /> Group gift
        </button>
      </div>
      {isGroup && (
        <p className="mt-2 text-xs text-muted-foreground">We&apos;ll add a group card so you can track who chips in and how much.</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => submit(false)}
          disabled={pending || !ready}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/25 transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Create plan
        </button>
        {usingSavedPerson && (
          <button
            onClick={() => submit(true)}
            disabled={pending || !ready}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-5 py-2.5 text-xs sm:text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Create &amp; find ideas
          </button>
        )}
        <span className="ml-auto hidden text-xs text-muted-foreground sm:block">Budget &amp; reminders — add after</span>
      </div>
    </div>
  );
}

/* ── Plan card (collapsible) ──────────────────────────────────────── */

function PlanCard({
  plan,
  group,
  onPatch,
  onRemove,
  onAddGroup,
  onPatchGroup,
  onRemoveGroup,
}: {
  plan: PlanVM;
  group?: GroupGift;
  onPatch: (id: string, patch: Partial<PlanVM>) => void;
  onRemove: (id: string) => void;
  onAddGroup: (g: GroupGift) => void;
  onPatchGroup: (id: string, patch: Partial<GroupGift>) => void;
  onRemoveGroup: (id: string) => void;
}) {
  const router = useRouter();
  const meta = planOccasionMeta(plan.occasion);
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(plan.budgetMin?.toString() ?? "");
  const [max, setMax] = useState(plan.budgetMax?.toString() ?? "");
  const [notes, setNotes] = useState(plan.notes ?? "");
  const [notify, setNotify] = useState(plan.notifyDate ?? "");
  const [saving, startSave] = useTransition();
  const [generating, startGen] = useTransition();
  const [creatingGroup, startGroup] = useTransition();

  const firstName = firstNameOf(plan.recipientName);
  const notifyDays = plan.notifyDate ? daysToDateStr(plan.notifyDate) : null;

  function persist(patch: Partial<PlanVM>, fields: Parameters<typeof updateGiftPlan>[1]) {
    onPatch(plan.id, patch);
    startSave(async () => {
      try {
        await updateGiftPlan(plan.id, fields);
      } catch {
        toast.error("Couldn't save");
      }
    });
  }

  function generate() {
    if (!plan.profileId) return toast.error("Add this person to your people to generate ideas.");
    startGen(async () => {
      try {
        const result = await generatePlanIdeas(plan.id);
        if ("paymentRequired" in result) {
          goPaywall(router);
          return;
        }
        onPatch(plan.id, { runId: result.runId, status: "planned" });
        router.push(`/dashboard/results/${result.runId}` as never);
      } catch (e) {
        handleGenerationError(e);
      }
    });
  }

  function createGroup() {
    startGroup(async () => {
      try {
        const { id: groupId } = await upsertGiftGroup({ occasionKey: plan.id, profileId: plan.profileId, title: `Group gift for ${firstName}` });
        onAddGroup({ id: groupId, occasionKey: plan.id, profileId: plan.profileId, title: `Group gift for ${firstName}`, targetAmount: max ? Number(max) : null, ordered: false, contributors: [] });
      } catch {
        toast.error("Couldn't start a group gift");
      }
    });
  }

  const budget = budgetSummary(min, max);

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-colors hover:border-white/15">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-4 p-5 text-left">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-2xl shadow-sm shadow-primary/15 ring-1 ring-primary/10">{meta.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold leading-tight">
            {meta.label} for {plan.recipientName}
            {plan.isGroup && <Users className="ml-1 inline h-3.5 w-3.5 align-middle text-primary" />}
          </p>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {plan.notes ? plan.notes : "Tap to plan the details"}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center whitespace-nowrap rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {statusLabel(plan.status)}
            </span>
            {budget && (
              <span className="inline-flex items-center whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{budget}</span>
            )}
            {plan.runId && (
              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" /> Ideas ready
              </span>
            )}
            {group && (
              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <Users className="h-3 w-3" /> Group
              </span>
            )}
          </div>
        </div>
        {notifyDays !== null && (
          <span className={cn("shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold", urgencyTone(notifyDays))}>
            {notifyDays < 0 ? `${Math.abs(notifyDays)}d over` : notifyDays === 0 ? "Today" : countdownLabel(notifyDays)}
          </span>
        )}
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className={cn("border-t border-border/60 p-5", group && "lg:grid lg:grid-cols-2 lg:items-start lg:gap-8")}>
          <div className="min-w-0 space-y-5">
            <div>
              <FieldLabel>Status</FieldLabel>
              <div className="flex items-center gap-2">
                <StatusSegment value={plan.status} disabled={saving} onChange={(next) => persist({ status: next }, { status: next })} />
                {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Budget</FieldLabel>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>$</span>
                  <Input value={min} onChange={(e) => setMin(e.target.value)} onBlur={() => persist({ budgetMin: min ? Number(min) : null }, { budgetMin: min ? Number(min) : null })} placeholder="min" className="h-9 w-full text-sm" inputMode="numeric" />
                  <span>–</span>
                  <Input value={max} onChange={(e) => setMax(e.target.value)} onBlur={() => persist({ budgetMax: max ? Number(max) : null }, { budgetMax: max ? Number(max) : null })} placeholder="max" className="h-9 w-full text-sm" inputMode="numeric" />
                </div>
              </div>
              <div>
                <FieldLabel>Notify me by</FieldLabel>
                <Input type="date" value={notify} onChange={(e) => setNotify(e.target.value)} onBlur={() => persist({ notifyDate: notify || null }, { notifyDate: notify || null })} className="h-9 w-full text-sm" />
              </div>
            </div>

            <div>
              <FieldLabel>Early ideas or gift directions</FieldLabel>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => persist({ notes: notes.trim() || null }, { notes: notes.trim() || null })}
                placeholder={`Anything you're already thinking of for ${firstName}…`}
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {plan.runId ? (
                <Link href={`/dashboard/results/${plan.runId}` as never} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground hover:opacity-90">
                  <Sparkles className="h-4 w-4" /> View ideas
                </Link>
              ) : (
                <button
                  onClick={generate}
                  disabled={generating || !plan.profileId}
                  title={plan.profileId ? undefined : "Add this person to your people to generate ideas"}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Bring ideas
                </button>
              )}
              {!group && (
                <button onClick={createGroup} disabled={creatingGroup} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                  {creatingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} Make it a group gift
                </button>
              )}
              <button
                onClick={() => {
                  onRemove(plan.id);
                  deleteGiftPlan(plan.id).catch(() => toast.error("Couldn't delete"));
                }}
                className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>

          {group && (
            <div className="mt-5 min-w-0 lg:mt-0">
              <GroupCard group={group} onPatch={onPatchGroup} onRemove={onRemoveGroup} />
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/* ── Occasion card (collapsible) ──────────────────────────────────── */

function OccasionCard({
  occasion,
  days,
  past,
  group,
  onAddGroup,
  onPatchGroup,
  onRemoveGroup,
}: {
  occasion: PlannerOccasion;
  days: number;
  past: PastGift[];
  group?: GroupGift;
  onAddGroup: (g: GroupGift) => void;
  onPatchGroup: (id: string, patch: Partial<GroupGift>) => void;
  onRemoveGroup: (id: string) => void;
}) {
  const router = useRouter();
  const [id, setId] = useState(occasion.id);
  const [open, setOpen] = useState(false);
  const [min, setMin] = useState(occasion.budgetMin?.toString() ?? "");
  const [max, setMax] = useState(occasion.budgetMax?.toString() ?? "");
  const [notes, setNotes] = useState(occasion.notes ?? "");
  const [status, setStatus] = useState(occasion.giftStatus);
  const [showPast, setShowPast] = useState(false);
  const [saving, startSave] = useTransition();
  const [generating, startGen] = useTransition();
  const [creatingGroup, startGroup] = useTransition();

  const firstName = firstNameOf(occasion.profileName);

  function persist(fields: Parameters<typeof updateOccasionPlan>[1]) {
    startSave(async () => {
      try {
        if (id.startsWith("bday-")) {
          const { occasionId } = await planProfileBirthday(occasion.profileId, fields);
          setId(occasionId);
        } else {
          await updateOccasionPlan(id, fields);
        }
      } catch {
        toast.error("Couldn't save");
      }
    });
  }

  function saveStatus(next: string) {
    setStatus(next);
    persist({ giftStatus: next });
  }

  function saveBudget() {
    persist({ budgetMin: min ? Number(min) : null, budgetMax: max ? Number(max) : null });
  }

  function generate() {
    startGen(async () => {
      try {
        const result = await generateIdeasFor({ profileId: occasion.profileId, occasion: occasion.type, budgetMin: min ? Number(min) : null, budgetMax: max ? Number(max) : null });
        if ("paymentRequired" in result) {
          goPaywall(router);
          return;
        }
        toast.success("Fresh ideas ready");
        router.push(`/dashboard/results/${result.runId}` as never);
      } catch (e) {
        handleGenerationError(e);
      }
    });
  }

  function createGroup() {
    startGroup(async () => {
      try {
        const { id: groupId } = await upsertGiftGroup({ occasionKey: occasion.id, profileId: occasion.profileId, title: `${occasion.label} for ${firstName}` });
        onAddGroup({ id: groupId, occasionKey: occasion.id, profileId: occasion.profileId, title: `${occasion.label} for ${firstName}`, targetAmount: max ? Number(max) : null, ordered: false, contributors: [] });
      } catch {
        toast.error("Couldn't start a group gift");
      }
    });
  }

  const budget = budgetSummary(min, max);

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-colors hover:border-white/15">
      <div style={{ boxShadow: `inset 4px 0 0 ${occasion.profileColor}` }}>
        <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-4 p-5 pl-6 text-left">
          <div className="w-14 shrink-0 rounded-2xl bg-secondary/60 py-2 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{MONTHS[occasion.month]}</p>
            <p className="text-2xl font-bold leading-none tabular-nums">{occasion.day}</p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold leading-tight">
              {occasion.emoji} {occasion.profileName}
            </p>
            <p className="mt-0.5 truncate text-sm capitalize text-muted-foreground">
              {occasion.label}
              {occasion.relationship ? ` · ${occasion.relationship}` : ""}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {statusLabel(status)}
              </span>
              {budget && (
                <span className="inline-flex items-center whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{budget}</span>
              )}
              {group && (
                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <Users className="h-3 w-3" /> Group
                </span>
              )}
              {past.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {past.length} past gift{past.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <span className={cn("shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold", urgencyTone(days))}>
            {days === 0 ? "Today" : countdownLabel(days)}
          </span>
          <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className={cn("border-t border-border/60 p-5 pl-6", group && "lg:grid lg:grid-cols-2 lg:items-start lg:gap-8")}>
            <div className="min-w-0">
              <Link href={`/dashboard/people/${occasion.profileId}` as never} className="text-sm font-medium text-primary hover:underline">
                Open {firstName}&apos;s profile →
              </Link>

              <div className="mt-4">
                <FieldLabel>Status</FieldLabel>
                <div className="flex items-center gap-2">
                  <StatusSegment value={status} onChange={saveStatus} disabled={saving} />
                  {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              </div>

              <div className="mt-5 max-w-xs">
                <FieldLabel>Budget</FieldLabel>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>$</span>
                  <Input value={min} onChange={(e) => setMin(e.target.value)} onBlur={saveBudget} placeholder="min" className="h-9 w-full text-sm" inputMode="numeric" />
                  <span>–</span>
                  <Input value={max} onChange={(e) => setMax(e.target.value)} onBlur={saveBudget} placeholder="max" className="h-9 w-full text-sm" inputMode="numeric" />
                </div>
              </div>

              <div className="mt-5">
                <FieldLabel>Early ideas or gift directions</FieldLabel>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => persist({ notes: notes.trim() || null })}
                  placeholder={`Anything you're already thinking of for ${firstName}…`}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>

              <ReminderTrack days={days} onGenerate={generate} generating={generating} />

              {past.length > 0 && (
                <div className="mt-4">
                  <button onClick={() => setShowPast((v) => !v)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
                    <History className="h-4 w-4" />
                    What you gave {firstName} before ({past.length})
                    <ChevronDown className={cn("h-4 w-4 transition-transform", showPast && "rotate-180")} />
                  </button>
                  {showPast && (
                    <ul className="mt-2 space-y-1.5">
                      {past.map((g, i) => (
                        <li key={i} className="flex items-center gap-2 rounded-xl bg-secondary/40 px-3.5 py-2.5 text-sm">
                          <span className="font-medium text-foreground">{g.title}</span>
                          <span className="text-muted-foreground">{[g.year, g.occasion, g.priceText].filter(Boolean).join(" · ")}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {!group && (
                <button onClick={createGroup} disabled={creatingGroup} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                  {creatingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />} Make it a group gift
                </button>
              )}
            </div>

            {group && (
              <div className="mt-5 min-w-0 lg:mt-0">
                <GroupCard group={group} onPatch={onPatchGroup} onRemove={onRemoveGroup} />
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/* ── Reminder track (30 / 14 / 3 days) ────────────────────────────── */

function ReminderTrack({ days, onGenerate, generating }: { days: number; onGenerate: () => void; generating: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-2xl bg-secondary/30 px-4 py-3">
      <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex items-center gap-1.5">
        {[30, 14, 3].map((t) => {
          const reached = days <= t;
          const key = t === 14;
          return (
            <span
              key={t}
              title={t === 14 ? "14-day check-in — brings fresh AI ideas based on anything new in their profile" : `${t}-day reminder`}
              className={cn(
                "whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
                key
                  ? reached
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/15 text-primary ring-1 ring-primary/30"
                  : reached
                    ? "bg-foreground/15 text-foreground"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {t}d
            </span>
          );
        })}
      </div>
      <button
        onClick={onGenerate}
        disabled={generating}
        className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        title="Generate fresh gift ideas now (the 14-day nudge, on demand)"
      >
        {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Bring ideas
      </button>
    </div>
  );
}

/* ── Group gift card ──────────────────────────────────────────────── */

function GroupCard({
  group,
  onPatch,
  onRemove,
}: {
  group: GroupGift;
  onPatch: (id: string, patch: Partial<GroupGift>) => void;
  onRemove: (id: string) => void;
}) {
  const [target, setTarget] = useState(group.targetAmount?.toString() ?? "");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [, startTx] = useTransition();

  const collected = group.contributors.filter((c) => c.paid).reduce((s, c) => s + (c.amount || 0), 0);
  const pledged = group.contributors.reduce((s, c) => s + (c.amount || 0), 0);
  const targetNum = group.targetAmount ?? 0;
  const pct = targetNum > 0 ? Math.min(100, Math.round((collected / targetNum) * 100)) : 0;

  function save(patch: Partial<GroupGift>) {
    onPatch(group.id, patch);
    startTx(async () => {
      try {
        await updateGiftGroup(group.id, patch);
      } catch {
        toast.error("Couldn't update the group gift");
      }
    });
  }

  function addContributor() {
    const n = name.trim();
    if (!n) return;
    setName("");
    setAmount("");
    save({ contributors: [...group.contributors, { name: n, amount: amount ? Number(amount) : 0, paid: false }] });
  }

  function remove() {
    onRemove(group.id);
    startTx(async () => {
      try {
        await deleteGiftGroup(group.id);
      } catch {
        toast.error("Couldn't remove the group gift");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <span className="text-base font-bold">{group.title}</span>
        <button
          onClick={() => save({ ordered: !group.ordered })}
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors",
            group.ordered ? "bg-primary/15 text-primary" : "border border-border text-muted-foreground hover:text-foreground",
          )}
        >
          <Check className="h-4 w-4" /> {group.ordered ? "Ordered" : "Not ordered"}
        </button>
        <button onClick={remove} className="text-muted-foreground hover:text-red-500" title="Remove group gift">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">
            ${collected.toLocaleString()} collected
            {targetNum > 0 && <span className="text-muted-foreground"> of ${targetNum.toLocaleString()}</span>}
          </span>
          <span className="flex items-center gap-2 text-muted-foreground">
            target $
            <Input value={target} onChange={(e) => setTarget(e.target.value)} onBlur={() => save({ targetAmount: target ? Number(target) : null })} placeholder="0" className="h-9 w-20 text-sm" inputMode="numeric" />
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-secondary ring-1 ring-border/50">
          <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all" style={{ width: `${pct}%` }} />
        </div>
        {pledged > collected && <p className="mt-1.5 text-xs text-muted-foreground">${(pledged - collected).toLocaleString()} pledged, not yet collected</p>}
      </div>

      <ul className="mt-3 space-y-2">
        {group.contributors.map((c, i) => (
          <li key={i} className="flex items-center gap-2.5 text-sm">
            <button
              onClick={() => save({ contributors: group.contributors.map((x, j) => (j === i ? { ...x, paid: !x.paid } : x)) })}
              className={cn("inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors", c.paid ? "border-primary bg-primary text-primary-foreground" : "border-border")}
              title={c.paid ? "Paid" : "Mark paid"}
            >
              {c.paid && <Check className="h-3.5 w-3.5" />}
            </button>
            <span className={cn("flex-1 truncate", c.paid ? "text-foreground" : "text-muted-foreground")}>{c.name}</span>
            <span className="font-semibold text-foreground">${(c.amount || 0).toLocaleString()}</span>
            <button onClick={() => save({ contributors: group.contributors.filter((_, j) => j !== i) })} className="text-muted-foreground hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Who's chipping in" className="h-9 flex-1 text-sm" />
        <span className="text-sm text-muted-foreground">$</span>
        <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="h-9 w-20 text-sm" inputMode="numeric" />
        <button onClick={addContributor} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90" title="Add">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ── January planning mode ────────────────────────────────────────── */

function JanuaryMode({
  people,
  year,
}: {
  people: { name: string; color: string; rel: string | null; items: PlannerOccasion[] }[];
  year: number;
}) {
  return (
    <div className="space-y-2.5">
      <div className="rounded-3xl border border-primary/15 bg-primary/8 p-5">
        <h3 className="flex items-center gap-2 text-base font-bold">
          <Sparkles className="h-4 w-4 text-primary" /> Plan {year} in one session
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Set a budget and a rough gift direction for every person now — front-load the thinking once.
        </p>
      </div>

      {people.map((person) => {
        const total = person.items.reduce((s, o) => s + (o.budgetMax ?? o.budgetMin ?? 0), 0);
        return (
          <section key={person.name + person.items[0]?.id} className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3.5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: person.color }}>
                {person.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold leading-tight">{person.name}</p>
                {person.rel && <p className="text-xs capitalize text-muted-foreground">{person.rel}</p>}
              </div>
              <span className="text-base font-bold text-primary tabular-nums">${total.toLocaleString()}</span>
            </div>
            <div className="space-y-2">
              {person.items.map((o) => (
                <JanuaryRow key={o.id} occasion={o} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function JanuaryRow({ occasion }: { occasion: PlannerOccasion }) {
  const [id, setId] = useState(occasion.id);
  const [min, setMin] = useState(occasion.budgetMin?.toString() ?? "");
  const [max, setMax] = useState(occasion.budgetMax?.toString() ?? "");
  const [notes, setNotes] = useState(occasion.notes ?? "");
  const [, startSave] = useTransition();

  function persist(fields: Parameters<typeof updateOccasionPlan>[1]) {
    startSave(async () => {
      try {
        if (id.startsWith("bday-")) {
          const { occasionId } = await planProfileBirthday(occasion.profileId, fields);
          setId(occasionId);
        } else {
          await updateOccasionPlan(id, fields);
        }
      } catch {
        toast.error("Couldn't save");
      }
    });
  }

  const saveBudget = () => persist({ budgetMin: min ? Number(min) : null, budgetMax: max ? Number(max) : null });

  return (
    <div className="flex flex-wrap items-center gap-2.5 rounded-2xl bg-secondary/30 p-3">
      <span className="w-20 shrink-0 text-xs font-medium text-muted-foreground">
        {occasion.emoji} {MONTHS[occasion.month]} {occasion.day}
      </span>
      <span className="w-24 shrink-0 truncate text-sm font-semibold">{occasion.label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">$</span>
        <Input value={min} onChange={(e) => setMin(e.target.value)} onBlur={saveBudget} placeholder="min" className="h-8 w-14 text-xs" inputMode="numeric" />
        <span className="text-xs text-muted-foreground">–</span>
        <Input value={max} onChange={(e) => setMax(e.target.value)} onBlur={saveBudget} placeholder="max" className="h-8 w-14 text-xs" inputMode="numeric" />
      </div>
      <Input value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => persist({ notes: notes.trim() || null })} placeholder="Gift direction…" className="h-8 min-w-[140px] flex-1 text-xs" />
    </div>
  );
}
