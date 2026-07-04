import { notFound } from "next/navigation";

import prisma from "@Batman/db";
import { getSession } from "@/lib/session";
import { ResultsShop } from "@/components/giftmind/results-shop";
import { type GiftCardData } from "@/components/giftmind/gift-card";
import { labelFor, occasionMeta, TONES } from "@/lib/giftmind/constants";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const session = await getSession();
  const userId = session!.user.id;

  const run = await prisma.generationRun.findFirst({
    where: { id: runId, userId },
    include: {
      profile: true,
      ideas: { orderBy: { position: "asc" } },
    },
  });
  if (!run) notFound();

  const meta = occasionMeta(run.occasion);
  const gifts: GiftCardData[] = run.ideas.map((i) => ({
    id: i.id,
    name: i.name,
    reason: i.reason,
    about: i.about,
    searchQuery: i.searchQuery,
    buyUrl: i.buyUrl,
    imageUrl: i.imageUrl,
    imageUrls: i.imageUrls,
    priceText: i.priceText,
    estPrice: i.estPrice,
    type: i.type,
    vibe: i.vibe,
    splurgeWorthy: i.splurgeWorthy,
    cheaperAlt: i.cheaperAlt,
    premiumAlt: i.premiumAlt,
    personalTouch: i.personalTouch,
    saved: i.saved,
    purchased: i.purchased,
    trackPrice: i.trackPrice,
  }));

  return (
    <ResultsShop
      gifts={gifts}
      header={{
        runId: run.id,
        profileId: run.profileId,
        profileName: run.profile.name,
        profileColor: run.profile.avatarColor,
        occasionEmoji: meta.emoji,
        occasionLabel: meta.label,
        toneLabel: labelFor(TONES, run.tone) ?? run.tone,
        budgetMin: run.budgetMin,
        budgetMax: run.budgetMax,
        neverBuyFilter: run.neverBuyFilter,
        usedFallback: run.usedFallback,
      }}
    />
  );
}
