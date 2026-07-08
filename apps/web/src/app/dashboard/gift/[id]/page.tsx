import { notFound } from "next/navigation";

import prisma from "@Batman/db";
import { getSession } from "@/lib/session";
import { resolveGiftMedia } from "@/lib/actions/giftmind";
import { GiftDetailView } from "@/components/giftmind/gift-detail-view";
import { type GiftCardData } from "@/components/giftmind/gift-card";

export const dynamic = "force-dynamic";

export default async function GiftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const userId = session!.user.id;

  const idea = await prisma.giftIdea.findFirst({
    where: { id, run: { userId } },
    include: { run: { include: { profile: { select: { name: true } } } } },
  });
  if (!idea) notFound();

  // If the user opened this before its card finished streaming in, scrape the
  // real product now so the detail page shows a photo + price too.
  const media = idea.productSource
    ? { imageUrl: idea.imageUrl, imageUrls: idea.imageUrls, buyUrl: idea.buyUrl, priceText: idea.priceText }
    : await resolveGiftMedia(idea.id).catch(() => ({
        imageUrl: idea.imageUrl,
        imageUrls: idea.imageUrls,
        buyUrl: idea.buyUrl,
        priceText: idea.priceText,
      }));

  const gift: GiftCardData = {
    id: idea.id,
    name: idea.name,
    reason: idea.reason,
    about: idea.about,
    searchQuery: idea.searchQuery,
    buyUrl: media.buyUrl,
    imageUrl: media.imageUrl,
    imageUrls: media.imageUrls,
    priceText: media.priceText,
    productSource: idea.productSource,
    estPrice: idea.estPrice,
    type: idea.type,
    vibe: idea.vibe,
    splurgeWorthy: idea.splurgeWorthy,
    cheaperAlt: idea.cheaperAlt,
    premiumAlt: idea.premiumAlt,
    personalTouch: idea.personalTouch,
    saved: idea.saved,
    purchased: idea.purchased,
    trackPrice: idea.trackPrice,
  };

  const firstName = idea.run.profile.name.split(" ")[0];

  return <GiftDetailView gift={gift} firstName={firstName} backHref={`/dashboard/results/${idea.runId}`} />;
}
