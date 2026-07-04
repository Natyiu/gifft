"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { OptionGrid } from "@/components/giftmind/option-grid";
import { TagSelect } from "@/components/giftmind/tag-select";
import { PersonAvatar } from "@/components/giftmind/person-avatar";
import {
  RELATIONSHIPS,
  SATURDAYS,
  HOME_STYLES,
  SPENDING_STYLES,
  AESTHETICS,
  AGE_RANGES,
  INTEREST_TAGS,
} from "@/lib/giftmind/constants";
import { createProfile, updateProfile, type ProfileInput } from "@/lib/actions/giftmind";

type FormState = {
  name: string;
  relationship: string | null;
  gender: string;
  ageRange: string | null;
  birthday: string;
  interests: string[];
  freeSaturday: string | null;
  talksAbout: string;
  homeStyle: string | null;
  spendingStyle: string | null;
  tooMuchOf: string;
  wantsButNeverBought: string;
  lovedPastGifts: string;
  hobbies: string;
  lifeChanges: string;
  neverBuyThemselves: string;
  aesthetic: string | null;
  notes: string;
};

const EMPTY: FormState = {
  name: "",
  relationship: null,
  gender: "",
  ageRange: null,
  birthday: "",
  interests: [],
  freeSaturday: null,
  talksAbout: "",
  homeStyle: null,
  spendingStyle: null,
  tooMuchOf: "",
  wantsButNeverBought: "",
  lovedPastGifts: "",
  hobbies: "",
  lifeChanges: "",
  neverBuyThemselves: "",
  aesthetic: null,
  notes: "",
};

const STEPS = ["The basics", "What they're into", "The details that nail it"];

export function ProfileFlow({ profileId, initial }: { profileId?: string; initial?: Partial<FormState> }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({ ...EMPTY, ...initial });
  const [pending, start] = useTransition();
  const isEdit = Boolean(profileId);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function next() {
    if (step === 0 && !form.name.trim()) {
      toast.error("Just need their name to start.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function submit() {
    if (!form.name.trim()) {
      toast.error("Please add a name.");
      setStep(0);
      return;
    }
    const payload = formToPayload(form);
    start(async () => {
      try {
        if (isEdit && profileId) {
          await updateProfile(profileId, payload);
          toast.success("Profile updated.");
          router.push(`/dashboard/people/${profileId}`);
        } else {
          const { id } = await createProfile(payload);
          toast.success(`${form.name.split(" ")[0]}'s profile is ready.`);
          router.push(`/dashboard/people/${id}`);
        }
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        {form.name.trim() && <PersonAvatar name={form.name} size="md" />}
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            {isEdit
              ? `Edit ${form.name || "profile"}`
              : form.name.trim()
                ? `Tell me about ${form.name.split(" ")[0]}`
                : "Who are we shopping for?"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {STEPS[step]} · step {step + 1} of {STEPS.length}
          </p>
        </div>
      </div>

      <div className="mb-8 flex gap-1.5">
        {STEPS.map((_, i) => (
          <div key={i} className={"h-1.5 flex-1 rounded-full transition-colors " + (i <= step ? "bg-primary" : "bg-border")} />
        ))}
      </div>

      <RecipientFields step={step} form={form} set={set} />

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0 || pending} className="text-muted-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} className="rounded-full">
            Continue <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={submit} disabled={pending} className="rounded-full">
            {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
            {isEdit ? "Save changes" : "Save profile"}
          </Button>
        )}
      </div>
    </div>
  );
}

export function formToPayload(form: FormState): ProfileInput {
  return {
    name: form.name,
    relationship: form.relationship,
    gender: form.gender,
    ageYears: null,
    ageRange: form.ageRange,
    interests: form.interests,
    birthday: form.birthday || null,
    freeSaturday: form.freeSaturday,
    talksAbout: form.talksAbout,
    homeStyle: form.homeStyle,
    spendingStyle: form.spendingStyle,
    tooMuchOf: form.tooMuchOf,
    wantsButNeverBought: form.wantsButNeverBought,
    lovedPastGifts: form.lovedPastGifts,
    hobbies: form.hobbies,
    lifeChanges: form.lifeChanges,
    neverBuyThemselves: form.neverBuyThemselves,
    aesthetic: form.aesthetic,
    notes: form.notes,
  };
}

export type RecipientFormState = FormState;
export const EMPTY_RECIPIENT = EMPTY;

/** The shared question set — reused by the dashboard flow and the guest flow. */
export function RecipientFields({
  step,
  form,
  set,
}: {
  step: number;
  form: FormState;
  set: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
}) {
  return (
    <div className="space-y-6">
      {step === 0 && (
        <>
          <Field label="Their name" hint="First name is plenty.">
            <Input autoFocus value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Maya" />
          </Field>
          <Field label="Who are they to you?">
            <OptionGrid options={RELATIONSHIPS} value={form.relationship} onChange={(v) => set("relationship", v)} columns={3} />
          </Field>
          <Field label="Roughly how old are they?">
            <OptionGrid options={AGE_RANGES} value={form.ageRange} onChange={(v) => set("ageRange", v)} columns={4} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Pronouns / gender" hint="optional">
              <Input value={form.gender} onChange={(e) => set("gender", e.target.value)} placeholder="e.g. she/her" />
            </Field>
            <Field label="Birthday" hint="optional — we'll remind you">
              <Input type="date" value={form.birthday} onChange={(e) => set("birthday", e.target.value)} />
            </Field>
          </div>
        </>
      )}

      {step === 1 && (
        <>
          <Field label="Tap everything that sounds like them" hint="the more you pick, the sharper the ideas">
            <TagSelect options={INTEREST_TAGS} values={form.interests} onChange={(v) => set("interests", v)} />
          </Field>
          <Field
            label="Get specific — what are they actually into right now?"
            hint="the details are where the magic is"
          >
            <Textarea
              value={form.hobbies}
              onChange={(e) => set("hobbies", e.target.value)}
              rows={3}
              placeholder="e.g. got really into sourdough last year, watches a lot of Kenji on YouTube, just started bouldering"
            />
          </Field>
          <Field label="A typical free Saturday looks like…">
            <OptionGrid options={SATURDAYS} value={form.freeSaturday} onChange={(v) => set("freeSaturday", v)} columns={3} />
          </Field>
        </>
      )}

      {step === 2 && (
        <>
          <Field label="Something they've talked about wanting but never bought?" hint="the single best signal there is">
            <Textarea
              value={form.wantsButNeverBought}
              onChange={(e) => set("wantsButNeverBought", e.target.value)}
              rows={2}
              placeholder="e.g. a proper chef's knife, a record player, a weekend in the mountains"
            />
          </Field>
          <Field label="A past gift they genuinely loved?" hint="teaches GiftMind their taste">
            <Input
              value={form.lovedPastGifts}
              onChange={(e) => set("lovedPastGifts", e.target.value)}
              placeholder="e.g. the leather journal I gave them last year"
            />
          </Field>
          <Field label="Something they'd love but would never buy themselves?">
            <Input
              value={form.neverBuyThemselves}
              onChange={(e) => set("neverBuyThemselves", e.target.value)}
              placeholder="e.g. a really nice bottle of olive oil, a massage"
            />
          </Field>
          <Field label="What do they already have too much of?" hint="so we steer clear">
            <Input value={form.tooMuchOf} onChange={(e) => set("tooMuchOf", e.target.value)} placeholder="e.g. candles, mugs, scarves" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Their home is…">
              <OptionGrid options={HOME_STYLES} value={form.homeStyle} onChange={(v) => set("homeStyle", v)} columns={2} />
            </Field>
            <Field label="Their style is…">
              <OptionGrid options={AESTHETICS} value={form.aesthetic} onChange={(v) => set("aesthetic", v)} columns={2} />
            </Field>
          </div>
          <Field label="Anything happening in their life right now?" hint="new job, moved, new baby, retirement, a health journey…">
            <Textarea value={form.lifeChanges} onChange={(e) => set("lifeChanges", e.target.value)} rows={2} placeholder="e.g. just moved into her first place" />
          </Field>
          <Field label="Anything else worth knowing?" hint="optional">
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} />
          </Field>
        </>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 flex items-baseline gap-2">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
      </Label>
      {children}
    </div>
  );
}
