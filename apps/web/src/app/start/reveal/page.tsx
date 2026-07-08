"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Gift, LogIn, UserPlus, ArrowLeft, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { GiftMindMark, GiftMindWordmark } from "@/components/giftmind/logo";
import { PersonAvatar } from "@/components/giftmind/person-avatar";
import { generateFromDraft } from "@/lib/actions/giftmind";
import { syncPolarEntitlement } from "@/lib/actions/polar";
import { loadDraft, clearDraft, type GuestDraft } from "@/lib/giftmind/draft";

const REDIRECT = "/start/reveal";

export default function RevealPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [draft, setDraft] = useState<GuestDraft | null | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const [needsPay, setNeedsPay] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const started = useRef(false);

  // Load the saved draft once on mount.
  useEffect(() => {
    setDraft(loadDraft());
  }, []);

  // No draft → they arrived without a pending reveal. Wait for the session to
  // resolve, then send signed-in users (e.g. after a dashboard checkout) to the
  // dashboard, and everyone else back to the start.
  useEffect(() => {
    if (draft !== null || isPending) return;
    router.replace((session?.user ? "/dashboard" : "/start") as never);
  }, [draft, isPending, session, router]);

  // Run generation. If the gate says "not paid", the webhook may just be slow —
  // reconcile the entitlement straight from Polar's API and try once more before
  // falling back to the paywall.
  const generate = useCallback(async () => {
    if (!draft) return;
    const payload = {
      profile: draft.profile,
      occasion: draft.occasion,
      tone: draft.tone,
      budgetMin: draft.budgetMin,
      budgetMax: draft.budgetMax,
      neverBuyFilter: draft.neverBuyFilter,
    };
    setNeedsPay(false);
    setGenerating(true);
    try {
      let result = await generateFromDraft(payload);
      if ("paymentRequired" in result) {
        const sync = await syncPolarEntitlement();
        if (sync.entitled) {
          result = await generateFromDraft(payload);
        }
      }
      if ("paymentRequired" in result) {
        // Keep the draft saved (no profile was created) so that paying and
        // returning to this page reveals the ideas straight away.
        started.current = false;
        setGenerating(false);
        setNeedsPay(true);
        return;
      }
      clearDraft();
      router.replace(`/dashboard/results/${result.runId}` as never);
    } catch (e) {
      started.current = false;
      setGenerating(false);
      toast.error(e instanceof Error ? e.message : "Couldn't generate ideas.");
    }
  }, [draft, router]);

  // Once we have a session AND a draft, generate exactly once.
  useEffect(() => {
    if (isPending || !session?.user || !draft || started.current) return;
    started.current = true;
    void generate();
  }, [isPending, session, draft, generate]);

  // Paywall escape hatch: the user says they've paid — reconcile with Polar and,
  // if we now see the payment, generate immediately.
  const recheck = useCallback(async () => {
    setRechecking(true);
    try {
      const sync = await syncPolarEntitlement();
      if (sync.entitled) {
        started.current = true;
        void generate();
      } else {
        toast("No completed payment found yet — give it a few seconds and try again.");
      }
    } catch {
      toast.error("Couldn't check your payment. Try again in a moment.");
    } finally {
      setRechecking(false);
    }
  }, [generate]);

  if (draft === undefined || isPending) {
    return <Centered><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></Centered>;
  }

  if (draft === null) {
    return <Centered><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></Centered>;
  }

  const firstName = draft.recipientName.split(" ")[0];

  // Signed in but not subscribed → paywall. Their answers stay saved so paying
  // and returning to this page reveals the ideas.
  if (needsPay) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10 text-center">
        <GiftMindWordmark className="mb-8 h-7 w-auto" />
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">
            {firstName}&apos;s gift ideas are ready
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Subscribe to reveal your 15 personalized gift ideas — with the reasoning behind each one,
            plus real products to buy. Everything you entered is saved.
          </p>

          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-muted/60 p-3 text-sm">
            <PersonAvatar name={draft.recipientName} size="sm" />
            <span className="text-muted-foreground">
              Ideas for <span className="font-medium text-foreground">{firstName}</span>
            </span>
          </div>

          <Link href={"/pricing" as never} className="mt-6 block">
            <Button className="w-full rounded-full" size="lg">
              <Sparkles className="mr-2 h-4 w-4" /> Unlock the results
            </Button>
          </Link>

          <button
            type="button"
            onClick={recheck}
            disabled={rechecking}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-60"
          >
            {rechecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {rechecking ? "Checking your payment…" : "Already paid? Check again"}
          </button>
        </div>

        <Link href={"/start" as never} className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Edit the details
        </Link>
      </div>
    );
  }

  // Signed in → thinking + generating.
  if (session?.user || generating) {
    return (
      <Centered>
        <div className="gift-think-pulse">
          <GiftMindMark className="h-12 w-12" />
        </div>
        <p className="mt-5 font-serif text-xl font-semibold">Gift is thinking about {firstName}…</p>
        <p className="mt-2 text-sm text-muted-foreground">Curating gifts that feel made for them.</p>
        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> This takes a few seconds
        </div>
      </Centered>
    );
  }

  // Not signed in → gate.
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10 text-center">
      <GiftMindWordmark className="mb-8 h-7 w-auto" />
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Gift className="h-7 w-7 text-primary" />
        </div>
        <h1 className="font-serif text-2xl font-semibold tracking-tight">
          {firstName}&apos;s gift ideas are ready
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a free account (or sign in) to reveal your personalized ideas. Everything you entered is saved.
        </p>

        <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-muted/60 p-3 text-sm">
          <PersonAvatar name={draft.recipientName} size="sm" />
          <span className="text-muted-foreground">
            Ideas for <span className="font-medium text-foreground">{firstName}</span>
          </span>
        </div>

        <div className="mt-6 space-y-2.5">
          <Link href={`/signup?redirect=${encodeURIComponent(REDIRECT)}` as never} className="block">
            <Button className="w-full rounded-full" size="lg">
              <UserPlus className="mr-2 h-4 w-4" /> Create a free account
            </Button>
          </Link>
          <Link href={`/login?redirect=${encodeURIComponent(REDIRECT)}` as never} className="block">
            <Button variant="outline" className="w-full rounded-full" size="lg">
              <LogIn className="mr-2 h-4 w-4" /> I already have an account
            </Button>
          </Link>
        </div>
      </div>

      <Link href={"/start" as never} className="mt-6 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Edit the details
      </Link>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 text-center">
      {children}
    </div>
  );
}
