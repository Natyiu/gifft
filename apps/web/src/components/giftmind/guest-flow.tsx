"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Lock, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { OptionGrid } from "@/components/giftmind/option-grid";
import { PersonAvatar } from "@/components/giftmind/person-avatar";
import {
  RecipientFields,
  EMPTY_RECIPIENT,
  formToPayload,
  type RecipientFormState,
} from "@/components/giftmind/profile-flow";
import { OCCASIONS, TONES } from "@/lib/giftmind/constants";
import { saveDraft } from "@/lib/giftmind/draft";

const STEPS = ["The basics", "What they're into", "The details that nail it", "The occasion"];

export function GuestFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RecipientFormState>({ ...EMPTY_RECIPIENT });
  const [occasion, setOccasion] = useState<string | null>("birthday");
  const [tone, setTone] = useState<string | null>("practical");
  const [budgetMin, setBudgetMin] = useState("25");
  const [budgetMax, setBudgetMax] = useState("100");
  const [neverBuy, setNeverBuy] = useState(false);

  function set<K extends keyof RecipientFormState>(key: K, value: RecipientFormState[K]) {
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

  function finish() {
    if (!form.name.trim()) {
      toast.error("Please add a name.");
      setStep(0);
      return;
    }
    if (!occasion) {
      toast.error("Pick an occasion.");
      return;
    }
    const min = Number(budgetMin) || 0;
    const max = Number(budgetMax) || min + 50;
    saveDraft({
      recipientName: form.name,
      profile: formToPayload(form),
      occasion,
      tone: tone ?? "practical",
      budgetMin: min,
      budgetMax: max,
      neverBuyFilter: neverBuy,
    });
    router.push("/start/reveal" as never);
  }

  const firstName = form.name.trim().split(" ")[0];

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-6 flex items-center gap-3">
        {form.name.trim() && <PersonAvatar name={form.name} size="md" />}
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            {form.name.trim() ? `Tell me about ${firstName}` : "Who are we shopping for?"}
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

      {step < 3 ? (
        <RecipientFields step={step} form={form} set={set} />
      ) : (
        <div className="space-y-6">
          <div>
            <Label className="mb-2 block text-sm font-medium">What&apos;s the occasion?</Label>
            <OptionGrid options={OCCASIONS} value={occasion} onChange={setOccasion} columns={3} allowDeselect={false} />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">What kind of gift are you after?</Label>
            <OptionGrid options={TONES} value={tone} onChange={setTone} columns={3} allowDeselect={false} />
          </div>
          <div>
            <Label className="mb-2 block text-sm font-medium">Budget</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">$</span>
                <Input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} className="w-24" aria-label="Minimum budget" />
              </div>
              <span className="text-muted-foreground">to</span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-muted-foreground">$</span>
                <Input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} className="w-24" aria-label="Maximum budget" />
              </div>
            </div>
          </div>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background/50 p-3">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm">
                <span className="font-medium text-foreground">They&apos;d never buy this themselves</span>
                <span className="block text-xs text-muted-foreground">Lean into indulgent things only a gift can be</span>
              </span>
            </span>
            <Switch checked={neverBuy} onCheckedChange={setNeverBuy} />
          </label>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0} className="text-muted-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={next} className="rounded-full">
            Continue <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={finish} className="rounded-full">
            <Lock className="mr-1.5 h-4 w-4" /> See {firstName ? `${firstName}'s` : "the"} gift ideas
          </Button>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        We&apos;ll ask you to sign in on the next step to reveal your ideas — your answers are saved.
      </p>
    </div>
  );
}
