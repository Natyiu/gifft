"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, Check, Gift } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { OptionGrid } from "@/components/giftmind/option-grid";
import { AESTHETICS } from "@/lib/giftmind/constants";
import { submitWishlist, type ProfileInput } from "@/lib/actions/giftmind";

export function WishlistPublicForm({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [talksAbout, setTalksAbout] = useState("");
  const [wants, setWants] = useState("");
  const [loved, setLoved] = useState("");
  const [never, setNever] = useState("");
  const [aesthetic, setAesthetic] = useState<string | null>(null);
  const [tooMuch, setTooMuch] = useState("");
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit() {
    if (!name.trim()) {
      toast.error("Just your name to start!");
      return;
    }
    const responses: ProfileInput = {
      name,
      hobbies,
      talksAbout,
      wantsButNeverBought: wants,
      lovedPastGifts: loved,
      neverBuyThemselves: never,
      aesthetic,
      tooMuchOf: tooMuch,
    };
    start(async () => {
      try {
        await submitWishlist(token, name, responses);
        setDone(true);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Couldn't submit");
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-7 w-7 text-primary" />
        </div>
        <h2 className="font-serif text-2xl font-semibold">Thank you, {name.split(" ")[0]}!</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Your answers are on their way. Whoever sent this is about to find you something genuinely good.
        </p>
        <div className="mt-6 rounded-xl bg-secondary/60 p-4">
          <p className="text-sm font-medium text-foreground">Want to do this for someone else?</p>
          <p className="mt-1 text-xs text-muted-foreground">
            GiftMind turns a few details into specific, thoughtful gift ideas.
          </p>
          <Link href={"/signup" as never} className="mt-3 inline-block">
            <Button size="sm" className="whitespace-nowrap rounded-full">
              <Gift className="mr-1 h-4 w-4" /> Try GiftMind free
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <Field label="Your name">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoFocus />
      </Field>
      <Field label="What are you into lately?" hint="hobbies, obsessions, the specifics help">
        <Textarea value={hobbies} onChange={(e) => setHobbies(e.target.value)} rows={2} placeholder="e.g. just got into pottery, always reading sci-fi" />
      </Field>
      <Field label="What do you talk about most?">
        <Input value={talksAbout} onChange={(e) => setTalksAbout(e.target.value)} placeholder="e.g. my houseplants, climbing trips" />
      </Field>
      <Field label="Something you've wanted but never bought?">
        <Textarea value={wants} onChange={(e) => setWants(e.target.value)} rows={2} placeholder="e.g. a good espresso setup" />
      </Field>
      <Field label="A gift you genuinely loved getting?">
        <Input value={loved} onChange={(e) => setLoved(e.target.value)} placeholder="e.g. a personalized map print" />
      </Field>
      <Field label="Something you'd love but would never buy yourself?">
        <Input value={never} onChange={(e) => setNever(e.target.value)} placeholder="e.g. really nice wool socks, a spa day" />
      </Field>
      <Field label="What do you already have too much of?">
        <Input value={tooMuch} onChange={(e) => setTooMuch(e.target.value)} placeholder="e.g. candles, notebooks" />
      </Field>
      <Field label="Your aesthetic">
        <OptionGrid options={AESTHETICS} value={aesthetic} onChange={setAesthetic} columns={3} />
      </Field>

      <Button onClick={submit} disabled={pending} className="w-full whitespace-nowrap rounded-full" size="lg">
        {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
        Send my answers
      </Button>
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
