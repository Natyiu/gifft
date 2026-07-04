import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";

import prisma from "@Batman/db";
import { getSession } from "@/lib/session";
import { PersonAvatar } from "@/components/giftmind/person-avatar";
import { Button } from "@/components/ui/button";
import { AESTHETICS, INTEREST_TAGS, labelFor } from "@/lib/giftmind/constants";
import { type ProfileInput } from "@/lib/actions/giftmind";

export const dynamic = "force-dynamic";

export default async function WishlistResponsePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const session = await getSession();
  const userId = session!.user.id;

  const share = await prisma.wishlistShare.findFirst({ where: { token, userId } });
  if (!share || share.status !== "filled") notFound();

  const r = (share.responses ?? {}) as ProfileInput;
  const name = share.responderName || r.name || "Someone";

  const answers: { label: string; value: string }[] = [];
  const push = (label: string, v?: string | null) => {
    if (v && v.trim()) answers.push({ label, value: v.trim() });
  };
  if (r.interests?.length) push("Into", r.interests.map((i) => labelFor(INTEREST_TAGS, i) ?? i).join(", "));
  push("What they're into lately", r.hobbies);
  push("What they talk about most", r.talksAbout);
  push("Wanted but never bought", r.wantsButNeverBought);
  push("A gift they loved getting", r.lovedPastGifts);
  push("Would love but never buy themselves", r.neverBuyThemselves);
  push("Already have too much of", r.tooMuchOf);
  push("Their aesthetic", labelFor(AESTHETICS, r.aesthetic ?? null));
  push("Notes", r.notes);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={"/dashboard/wishlist" as never}
        className="mb-5 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to wishlist
      </Link>

      {/* Header */}
      <div className="flex items-center gap-4">
        <PersonAvatar name={name} size="xl" />
        <div className="min-w-0">
          <h1 className="font-serif text-3xl font-semibold tracking-tight">{name}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" /> Filled in · {share.title}
          </p>
        </div>
      </div>

      {/* Answers */}
      <div className="mt-6 divide-y divide-border/60 rounded-2xl border border-border bg-card p-1 shadow-sm">
        {answers.length > 0 ? (
          answers.map((a, i) => (
            <div key={i} className="px-4 py-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{a.label}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-foreground">{a.value}</p>
            </div>
          ))
        ) : (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            {name} didn&apos;t add many details, but you can still generate ideas.
          </p>
        )}
      </div>

      {/* Continue */}
      <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
        {share.profileId ? (
          <Link href={`/dashboard/people/${share.profileId}` as never}>
            <Button size="lg" className="w-full whitespace-nowrap rounded-full sm:w-auto">
              <Sparkles className="mr-1.5 h-4 w-4" /> Continue to generate gifts
            </Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
