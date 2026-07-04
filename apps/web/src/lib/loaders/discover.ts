"use server";

import prisma from "@Batman/db";

import { getSession } from "@/lib/session";
import { type PersonPick } from "@/components/giftmind/discover-feed";
import { DISCOVER_OCCASIONS, personasFromInterests } from "@/lib/giftmind/discover";
import { nextAnnualOccurrence, daysUntil, startOfToday } from "@/lib/giftmind/dates";

export type DiscoverData = {
  amazonTag: string | null;
  people: PersonPick[];
  media: Record<string, { imageUrl: string | null }>;
};

const OCCASION_VALUES = new Set(DISCOVER_OCCASIONS.map((o) => o.value));

export async function getDiscoverData(): Promise<DiscoverData> {
  const session = await getSession();
  const userId = session!.user.id;

  const profiles = await prisma.personProfile.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { occasions: { select: { type: true, date: true, recurring: true } } },
  });

  const today = startOfToday();
  const people: PersonPick[] = [];

  for (const p of profiles) {
    const personas = personasFromInterests(p.interests);
    const occasions = new Set<string>();
    for (const o of p.occasions) {
      if (!OCCASION_VALUES.has(o.type)) continue;
      const date = o.recurring ? nextAnnualOccurrence(o.date, today) : o.date;
      if (daysUntil(date, today) >= 0) occasions.add(o.type);
    }
    if (p.birthday) occasions.add("birthday");
    if (personas.length === 0 && occasions.size === 0) continue;
    people.push({ id: p.id, name: p.name, color: p.avatarColor, relationship: p.relationship, personas, occasions: [...occasions] });
  }

  const amazonTag = (process.env.AMAZON_ASSOCIATE_TAG || "").trim() || null;

  const cachedMedia = await prisma.discoverMedia.findMany({ select: { searchQuery: true, imageUrl: true } });
  const media: Record<string, { imageUrl: string | null }> = {};
  for (const m of cachedMedia) media[m.searchQuery] = { imageUrl: m.imageUrl };

  return { amazonTag, people, media };
}
