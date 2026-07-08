"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagSelect } from "@/components/giftmind/tag-select";
import { PersonAvatar } from "@/components/giftmind/person-avatar";
import { HoldToContinue } from "@/components/giftmind/hold-to-continue";
import {
  RELATIONSHIPS,
  AGE_RANGES,
  INTEREST_TAGS,
  SATURDAYS,
  HOME_STYLES,
  AESTHETICS,
  OCCASIONS,
  TONES,
  type OptionDef,
} from "@/lib/giftmind/constants";
import {
  EMPTY_RECIPIENT,
  formToPayload,
  type RecipientFormState,
} from "@/components/giftmind/profile-flow";
import { saveDraft, type GuestDraft } from "@/lib/giftmind/draft";
import { cn } from "@/lib/utils";

const BUDGETS: OptionDef[] = [
  { value: "0-25", label: "Under $25", emoji: "🪙" },
  { value: "25-50", label: "$25 – $50", emoji: "💵" },
  { value: "50-100", label: "$50 – $100", emoji: "💸" },
  { value: "100-250", label: "$100 – $250", emoji: "💳" },
  { value: "250-1000", label: "$250 & up", emoji: "💎" },
];

export type Answers = {
  name: string;
  relationship: string | null;
  ageRange: string | null;
  interests: string[];
  hobbies: string;
  freeSaturday: string | null;
  wantsButNeverBought: string;
  homeStyle: string | null;
  aesthetic: string | null;
  lovedPastGifts: string;
  neverBuyThemselves: string;
  tooMuchOf: string;
  lifeChanges: string;
  occasion: string | null;
  tone: string | null;
  budget: string | null;
  neverBuy: string | null;
};

export const EMPTY_ANSWERS: Answers = {
  name: "",
  relationship: null,
  ageRange: null,
  interests: [],
  hobbies: "",
  freeSaturday: null,
  wantsButNeverBought: "",
  homeStyle: null,
  aesthetic: null,
  lovedPastGifts: "",
  neverBuyThemselves: "",
  tooMuchOf: "",
  lifeChanges: "",
  occasion: null,
  tone: null,
  budget: null,
  neverBuy: null,
};

type Question =
  | {
      kind: "text";
      id: keyof Answers;
      emoji: string;
      prompt: (name: string) => string;
      sub?: string;
      placeholder?: string;
      multiline?: boolean;
      optional?: boolean;
    }
  | {
      kind: "single";
      id: keyof Answers;
      emoji: string;
      prompt: (name: string) => string;
      sub?: string;
      options: OptionDef[];
      optional?: boolean;
    }
  | {
      kind: "multi";
      id: keyof Answers;
      emoji: string;
      prompt: (name: string) => string;
      sub?: string;
      options: OptionDef[];
      optional?: boolean;
    };

export const QUESTIONS: Question[] = [
  {
    kind: "text",
    id: "name",
    emoji: "👋",
    prompt: () => "Who are we finding a gift for?",
    sub: "First name is all we need.",
    placeholder: "e.g. Maya",
  },
  {
    kind: "single",
    id: "relationship",
    emoji: "💞",
    prompt: (n) => `Who is ${n} to you?`,
    options: RELATIONSHIPS,
  },
  {
    kind: "single",
    id: "ageRange",
    emoji: "🎂",
    prompt: (n) => `Roughly how old is ${n}?`,
    options: AGE_RANGES,
  },
  {
    kind: "multi",
    id: "interests",
    emoji: "🎨",
    prompt: (n) => `What is ${n} into?`,
    sub: "Tap everything that fits — the more, the sharper the ideas.",
    options: INTEREST_TAGS,
    optional: true,
  },
  {
    kind: "text",
    id: "hobbies",
    emoji: "🔥",
    prompt: (n) => `Anything ${n} is a little obsessed with right now?`,
    sub: "This is where the magic hides. Totally optional.",
    placeholder: "e.g. got into sourdough, watches Kenji on YouTube, just started bouldering",
    multiline: true,
    optional: true,
  },
  {
    kind: "single",
    id: "freeSaturday",
    emoji: "🗓️",
    prompt: (n) => `A perfect free Saturday for ${n} looks like…`,
    options: SATURDAYS,
  },
  {
    kind: "text",
    id: "wantsButNeverBought",
    emoji: "🎯",
    prompt: (n) => `Has ${n} mentioned wanting something but never bought it?`,
    sub: "The single best clue there is.",
    placeholder: "e.g. a proper chef's knife, a record player, a weekend away",
    multiline: true,
    optional: true,
  },
  {
    kind: "single",
    id: "homeStyle",
    emoji: "🏠",
    prompt: (n) => `${n}'s home is more…`,
    options: HOME_STYLES,
  },
  {
    kind: "single",
    id: "aesthetic",
    emoji: "✨",
    prompt: (n) => `And their style is…`,
    options: AESTHETICS,
  },
  {
    kind: "text",
    id: "lovedPastGifts",
    emoji: "💝",
    prompt: (n) => `A past gift ${n} genuinely loved?`,
    sub: "Teaches GiftMind their taste. Optional.",
    placeholder: "e.g. the leather journal I gave them last year",
    optional: true,
  },
  {
    kind: "text",
    id: "neverBuyThemselves",
    emoji: "🙈",
    prompt: (n) => `Something ${n} would love but never buy themselves?`,
    placeholder: "e.g. a really nice bottle of olive oil, a massage",
    optional: true,
  },
  {
    kind: "text",
    id: "tooMuchOf",
    emoji: "🙅",
    prompt: (n) => `Anything ${n} already has way too much of?`,
    sub: "So we steer clear. Optional.",
    placeholder: "e.g. candles, mugs, scarves",
    optional: true,
  },
  {
    kind: "text",
    id: "lifeChanges",
    emoji: "🌱",
    prompt: (n) => `Anything big happening in ${n}'s life right now?`,
    sub: "New job, moved, new baby, a health journey… Optional.",
    placeholder: "e.g. just moved into her first place",
    optional: true,
  },
  {
    kind: "single",
    id: "occasion",
    emoji: "🎉",
    prompt: () => "What's the occasion?",
    options: OCCASIONS,
  },
  {
    kind: "single",
    id: "tone",
    emoji: "🎁",
    prompt: () => "What kind of gift are you after?",
    options: TONES,
  },
  {
    kind: "single",
    id: "budget",
    emoji: "💰",
    prompt: () => "What's the budget?",
    options: BUDGETS,
  },
];

/** Turn collected quiz answers into the guest draft persisted for the reveal step. */
export function buildDraft(answers: Answers): GuestDraft {
  const [budgetMin, budgetMax] = (answers.budget ?? "25-100").split("-").map((n) => Number(n));
  const form: RecipientFormState = {
    ...EMPTY_RECIPIENT,
    name: answers.name,
    relationship: answers.relationship,
    ageRange: answers.ageRange,
    interests: answers.interests,
    hobbies: answers.hobbies,
    freeSaturday: answers.freeSaturday,
    wantsButNeverBought: answers.wantsButNeverBought,
    homeStyle: answers.homeStyle,
    aesthetic: answers.aesthetic,
    lovedPastGifts: answers.lovedPastGifts,
    neverBuyThemselves: answers.neverBuyThemselves,
    tooMuchOf: answers.tooMuchOf,
    lifeChanges: answers.lifeChanges,
  };
  return {
    recipientName: answers.name,
    profile: formToPayload(form),
    occasion: answers.occasion ?? "birthday",
    tone: answers.tone ?? "practical",
    budgetMin: Number.isFinite(budgetMin) ? budgetMin : 25,
    budgetMax: Number.isFinite(budgetMax) ? budgetMax : 100,
    neverBuyFilter: answers.neverBuy === "yes",
  };
}

export function QuizFlow() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ ...EMPTY_ANSWERS });
  const [submitting, setSubmitting] = useState(false);
  const advanceTimer = useRef<number | null>(null);

  const total = QUESTIONS.length;
  const onFinale = index === total;
  const q = onFinale ? null : QUESTIONS[index];
  const firstName = answers.name.trim().split(" ")[0] || "them";

  function set<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  function goNext() {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    // Name is the one thing we truly need.
    if (q && q.id === "name" && !answers.name.trim()) {
      toast.error("We just need their name to start.");
      return;
    }
    setIndex((i) => Math.min(i + 1, total));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    setIndex((i) => Math.max(i - 1, 0));
  }

  // Single-select: fill the choice, then glide to the next question.
  function pickSingle(value: string) {
    if (!q) return;
    const current = answers[q.id];
    const nextVal = current === value && q.optional ? null : value;
    set(q.id, nextVal as Answers[typeof q.id]);
    if (nextVal == null) return;
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(goNext, 320);
  }

  function finish() {
    if (!answers.name.trim()) {
      toast.error("We just need their name to start.");
      setIndex(0);
      return;
    }
    setSubmitting(true);
    saveDraft(buildDraft(answers));
    router.push("/start/reveal" as never);
  }

  const value = q ? answers[q.id] : null;
  const hasAnswer = !q
    ? false
    : q.kind === "multi"
      ? (value as string[]).length > 0
      : typeof value === "string"
        ? value.trim().length > 0
        : value != null;
  const canSkip = Boolean(q?.optional);
  const nameMissing = q?.id === "name" && !answers.name.trim();
  const progressPct = onFinale ? 100 : ((index + 1) / total) * 100;

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-xl flex-col px-5 py-6">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            {answers.name.trim() && <PersonAvatar name={answers.name} size="sm" />}
            {answers.name.trim() ? `Finding a gift for ${firstName}` : "Let's find the perfect gift"}
          </span>
          <span>
            {Math.min(index + 1, total)} / {total}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Finale — the grand reveal moment */}
      {onFinale ? (
        <div
          key="finale"
          className="flex flex-1 flex-col items-center justify-center text-center animate-in fade-in-0 zoom-in-95 duration-500"
        >
          <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-balance sm:text-3xl">
            {answers.name.trim()
              ? `Ready to meet ${firstName}'s gifts?`
              : "Ready for the gift ideas?"}
          </h1>
          <p className="mt-2 mb-8 max-w-sm text-sm text-muted-foreground">
            GiftMind has everything it needs. Hold the gift to unwrap your ideas.
          </p>
          <HoldToContinue
            onComplete={finish}
            disabled={submitting}
            label={submitting ? "Unwrapping…" : "Hold to reveal"}
            hint="press & hold"
          />
        </div>
      ) : (
        q && (
          <div
            key={index}
            className="flex flex-1 flex-col animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
          >
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/15 to-accent/10 text-4xl shadow-sm ring-1 ring-primary/10">
                {q.emoji}
              </div>
              <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-balance sm:text-3xl">
                {q.prompt(firstName)}
              </h1>
              {q.sub && <p className="mt-2 text-sm text-muted-foreground">{q.sub}</p>}
            </div>

            <div className="flex flex-1 flex-col">
              {q.kind === "text" && (
                <TextQuestion
                  multiline={Boolean(q.multiline)}
                  placeholder={q.placeholder}
                  value={value as string}
                  onChange={(v) => set(q.id, v as Answers[typeof q.id])}
                  onEnter={!q.multiline ? goNext : undefined}
                />
              )}

              {q.kind === "multi" && (
                <div className="mx-auto w-full max-w-lg">
                  <TagSelect
                    options={q.options}
                    values={value as string[]}
                    onChange={(v) => set(q.id, v as Answers[typeof q.id])}
                  />
                </div>
              )}

              {q.kind === "single" && (
                <ChoiceList
                  options={q.options}
                  value={value as string | null}
                  onPick={pickSingle}
                />
              )}
            </div>
          </div>
        )
      )}

      {/* Footer / continue */}
      <div className="mt-8 flex flex-col items-center gap-4">
        {!onFinale && q && q.kind !== "single" && (
          <HoldToContinue
            onComplete={goNext}
            disabled={Boolean(nameMissing) || submitting}
            label="Hold to continue"
            hint={
              nameMissing
                ? "add a name first"
                : hasAnswer || !canSkip
                  ? "press & hold"
                  : "press & hold — or skip"
            }
          />
        )}

        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={index === 0}
            className={cn(
              "inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
              index === 0 && "invisible",
            )}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {!onFinale && canSkip && !hasAnswer && !nameMissing && (
            <button
              type="button"
              onClick={goNext}
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Skip
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        We&apos;ll ask you to sign in at the end to reveal your ideas — your answers are saved.
      </p>
    </div>
  );
}

export function TextQuestion({
  multiline,
  placeholder,
  value,
  onChange,
  onEnter,
}: {
  multiline: boolean;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-lg">
      {multiline ? (
        <Textarea
          autoFocus
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="resize-none rounded-2xl text-lg"
        />
      ) : (
        <Input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" && onEnter) {
              e.preventDefault();
              onEnter();
            }
          }}
          className="h-14 rounded-2xl text-center text-xl"
        />
      )}
    </div>
  );
}

export function ChoiceList({
  options,
  value,
  onPick,
}: {
  options: OptionDef[];
  value: string | null;
  onPick: (value: string) => void;
}) {
  return (
    <div className="mx-auto grid w-full max-w-lg gap-2.5 sm:grid-cols-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onPick(opt.value)}
            className={cn(
              "group relative flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200",
              active
                ? "border-primary bg-primary/10 shadow-sm ring-2 ring-primary/30"
                : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
            )}
          >
            {opt.emoji && <span className="text-xl leading-none">{opt.emoji}</span>}
            <span className="flex-1 text-sm font-medium text-foreground">{opt.label}</span>
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                active
                  ? "scale-100 border-primary bg-primary text-primary-foreground"
                  : "scale-0 border-transparent",
              )}
            >
              <Check className="h-3 w-3" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
