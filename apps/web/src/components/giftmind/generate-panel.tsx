"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { OptionGrid } from "@/components/giftmind/option-grid";
import { GiftMindMark } from "@/components/giftmind/logo";
import { OCCASIONS, TONES } from "@/lib/giftmind/constants";
import { runGeneration } from "@/lib/actions/giftmind";

export function GeneratePanel({
  profileId,
  profileName,
  cues,
  ideasPerSearch,
  defaultOccasion = "birthday",
}: {
  profileId: string;
  profileName: string;
  cues: string[];
  ideasPerSearch: number;
  defaultOccasion?: string;
}) {
  const router = useRouter();
  const [occasion, setOccasion] = useState<string | null>(defaultOccasion);
  const [tone, setTone] = useState<string | null>("practical");
  const [budgetMin, setBudgetMin] = useState("25");
  const [budgetMax, setBudgetMax] = useState("100");
  const [neverBuy, setNeverBuy] = useState(false);
  const [pending, start] = useTransition();

  function generate() {
    if (!occasion) {
      toast.error("Pick an occasion first.");
      return;
    }
    const min = Number(budgetMin) || 0;
    const max = Number(budgetMax) || min + 50;
    start(async () => {
      try {
        const result = await runGeneration({
          profileId,
          occasion,
          tone: tone ?? "practical",
          budgetMin: min,
          budgetMax: max,
          neverBuyFilter: neverBuy,
        });
        if ("paymentRequired" in result) {
          toast("Subscribe to reveal your gift ideas.");
          router.push("/pricing" as never);
          return;
        }
        router.push(`/dashboard/results/${result.runId}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Generation failed.");
      }
    });
  }

  if (pending) {
    return <ThinkingMoment name={profileName} cues={cues} count={ideasPerSearch} />;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-primary" />
        <h2 className="font-serif text-lg font-semibold">Generate gift ideas</h2>
      </div>

      <div className="space-y-5">
        <div>
          <Label className="mb-2 block text-sm font-medium">Occasion</Label>
          <OptionGrid options={OCCASIONS} value={occasion} onChange={setOccasion} columns={3} allowDeselect={false} />
        </div>

        <div>
          <Label className="mb-2 block text-sm font-medium">Tone</Label>
          <OptionGrid options={TONES} value={tone} onChange={setTone} columns={3} allowDeselect={false} />
        </div>

        <div>
          <Label className="mb-2 block text-sm font-medium">Budget</Label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className="w-24"
                aria-label="Minimum budget"
              />
            </div>
            <span className="text-muted-foreground">to</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="w-24"
                aria-label="Maximum budget"
              />
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

        <Button onClick={generate} className="w-full rounded-full" size="lg">
          <Sparkles className="mr-1.5 h-4 w-4" /> Generate {ideasPerSearch} ideas for {profileName.split(" ")[0]}
        </Button>
      </div>
    </div>
  );
}

function ThinkingMoment({ name, cues, count }: { name: string; cues: string[]; count: number }) {
  const [i, setI] = useState(0);
  const lines = cues.length ? cues : ["Thinking about who they really are…"];

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % lines.length), 2600);
    return () => clearInterval(t);
  }, [lines.length]);

  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="gift-think-pulse">
        <GiftMindMark className="h-12 w-12" />
      </div>
      <p className="mt-5 font-serif text-xl font-semibold">
        GiftMind is thinking about {name.split(" ")[0]}…
      </p>
      <div className="relative mt-3 h-6 w-full max-w-sm">
        <p key={i} className="gift-cue absolute inset-0 text-sm text-muted-foreground">
          {lines[i]}
        </p>
      </div>
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Considering {count} genuinely good ideas
      </div>
    </div>
  );
}
