"use server";

import prisma from "@Batman/db";

import { getSession } from "@/lib/session";
import { type VaultRow } from "@/components/giftmind/vault-client";

export type VaultData = { rows: VaultRow[]; profiles: { id: string; name: string }[] };

export async function getVaultData(): Promise<VaultData> {
  const session = await getSession();
  const userId = session!.user.id;

  const [entries, profiles] = await Promise.all([
    prisma.giftVaultEntry.findMany({
      where: { userId },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      include: { profile: { select: { id: true, name: true } } },
    }),
    prisma.personProfile.findMany({ where: { userId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const rows: VaultRow[] = entries.map((e) => ({
    id: e.id,
    title: e.title,
    profileId: e.profileId,
    profileName: e.profile.name,
    occasion: e.occasion,
    year: e.year,
    direction: e.direction,
    source: e.source,
    reaction: e.reaction,
    priceText: e.priceText,
    notes: e.notes,
    imageUrl: e.imageUrl,
    buyUrl: e.buyUrl,
  }));

  return { rows, profiles };
}
