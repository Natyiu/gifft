"use server";

import prisma from "@Batman/db";

import { getSession } from "@/lib/session";
import { type PlannerOccasion, type PastGift, type GroupGift, type PlanVM, type Person } from "@/components/giftmind/planner-client";
import { occasionMeta, avatarColorFor } from "@/lib/giftmind/constants";

type Contributor = { name: string; amount: number; paid: boolean };

export type PlannerData = {
  occasions: PlannerOccasion[];
  pastByProfile: Record<string, PastGift[]>;
  groups: GroupGift[];
  people: Person[];
  plans: PlanVM[];
};

export async function getPlannerData(): Promise<PlannerData> {
  const session = await getSession();
  const userId = session!.user.id;

  const [occasions, profiles, vault, groupRows, planRows] = await Promise.all([
    prisma.occasion.findMany({
      where: { userId },
      include: { profile: { select: { id: true, name: true, avatarColor: true, relationship: true } } },
    }),
    prisma.personProfile.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, avatarColor: true, relationship: true, birthday: true },
    }),
    prisma.giftVaultEntry.findMany({
      where: { userId, direction: "given" },
      orderBy: { year: "desc" },
      select: { profileId: true, title: true, occasion: true, year: true, priceText: true, reaction: true },
    }),
    prisma.giftGroup.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.giftPlan.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  const rows: PlannerOccasion[] = [];
  for (const o of occasions) {
    const meta = occasionMeta(o.type);
    rows.push({
      id: o.id,
      profileId: o.profile.id,
      profileName: o.profile.name,
      profileColor: o.profile.avatarColor ?? avatarColorFor(o.profile.name),
      relationship: o.profile.relationship,
      type: o.type,
      emoji: meta.emoji,
      label: meta.label,
      month: o.date.getUTCMonth(),
      day: o.date.getUTCDate(),
      year: o.recurring ? null : o.date.getUTCFullYear(),
      budgetMin: o.budgetMin,
      budgetMax: o.budgetMax,
      notes: o.notes,
      giftStatus: o.giftStatus,
    });
  }
  for (const p of profiles) {
    if (!p.birthday) continue;
    if (occasions.some((o) => o.profileId === p.id && o.type === "birthday")) continue;
    const meta = occasionMeta("birthday");
    rows.push({
      id: `bday-${p.id}`,
      profileId: p.id,
      profileName: p.name,
      profileColor: p.avatarColor ?? avatarColorFor(p.name),
      relationship: p.relationship,
      type: "birthday",
      emoji: meta.emoji,
      label: meta.label,
      month: p.birthday.getUTCMonth(),
      day: p.birthday.getUTCDate(),
      year: null,
      budgetMin: null,
      budgetMax: null,
      notes: null,
      giftStatus: "idea",
      synthetic: true,
    });
  }

  const pastByProfile: Record<string, PastGift[]> = {};
  for (const v of vault) {
    (pastByProfile[v.profileId] ??= []).push({
      title: v.title,
      occasion: v.occasion,
      year: v.year,
      priceText: v.priceText,
      reaction: v.reaction,
    });
  }

  const groups: GroupGift[] = groupRows.map((g) => ({
    id: g.id,
    occasionKey: g.occasionKey,
    profileId: g.profileId,
    title: g.title,
    targetAmount: g.targetAmount,
    ordered: g.ordered,
    contributors: (Array.isArray(g.contributors) ? g.contributors : []) as unknown as Contributor[],
  }));

  const people: Person[] = profiles.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.avatarColor ?? avatarColorFor(p.name),
    relationship: p.relationship,
  }));

  const plans: PlanVM[] = planRows.map((p) => ({
    id: p.id,
    profileId: p.profileId,
    recipientName: p.recipientName,
    occasion: p.occasion,
    isGroup: p.isGroup,
    budgetMin: p.budgetMin,
    budgetMax: p.budgetMax,
    notes: p.notes,
    notifyDate: p.notifyDate ? p.notifyDate.toISOString().slice(0, 10) : null,
    status: p.status,
    runId: p.runId,
  }));

  return { occasions: rows, pastByProfile, groups, people, plans };
}
