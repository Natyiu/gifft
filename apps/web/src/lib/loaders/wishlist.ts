"use server";

import prisma from "@Batman/db";

import { getSession } from "@/lib/session";
import { type ShareRow } from "@/components/giftmind/wishlist-manager";
import { type WishlistItemRow, type ProfileInput } from "@/lib/actions/giftmind";
import { AESTHETICS, labelFor } from "@/lib/giftmind/constants";

/** A few short, labeled cues from a filled response, for the card's first view. */
function previewCues(responses: unknown): { label: string; value: string }[] {
  const r = (responses ?? {}) as ProfileInput;
  const cues: { label: string; value: string }[] = [];
  const trim = (s: string) => (s.length > 90 ? s.slice(0, 87) + "…" : s);
  const add = (label: string, value?: string | null) => {
    if (value && value.trim()) cues.push({ label, value: trim(value.trim()) });
  };
  add("Into", r.hobbies);
  add("Wants", r.wantsButNeverBought);
  add("Never buys", r.neverBuyThemselves);
  add("Loved before", r.lovedPastGifts);
  add("Talks about", r.talksAbout);
  add("Aesthetic", labelFor(AESTHETICS, r.aesthetic ?? null));
  return cues;
}

export type WishlistData = { itemRows: WishlistItemRow[]; shares: ShareRow[] };

export async function getWishlistData(): Promise<WishlistData> {
  const session = await getSession();
  const userId = session!.user.id;

  const [shares, items] = await Promise.all([
    prisma.wishlistShare.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.wishlistItem.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
  ]);

  const shareRows: ShareRow[] = shares.map((s) => ({
    token: s.token,
    title: s.title,
    status: s.status,
    responderName: s.responderName,
    profileId: s.profileId,
    preview: s.status === "filled" ? previewCues(s.responses) : [],
  }));

  const itemRows: WishlistItemRow[] = items.map((i) => ({
    id: i.id,
    url: i.url,
    buyUrl: i.buyUrl,
    title: i.title,
    imageUrl: i.imageUrl,
    priceText: i.priceText,
    source: i.source,
  }));

  return { itemRows, shares: shareRows };
}
