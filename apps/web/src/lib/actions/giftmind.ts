"use server";

import prisma, { Prisma } from "@Batman/db";
import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/session";
import { getSubscriptionStatus } from "@/lib/subscription";
import { generateGifts, type ProfileForGeneration } from "@/lib/giftmind/engine";
import { findProducts, scrapeProductUrl } from "@/lib/giftmind/product-finder";

// ── Entitlements ────────────────────────────────────────────────────
export async function getEntitlements(userId: string) {
  const { isSubscribed } = await getSubscriptionStatus(userId);
  // Paid-only app: there's no free tier of results. Everyone who has paid gets
  // the full 15 ideas per search; unpaid users are gated at "see results".
  return {
    plan: isSubscribed ? ("paid" as const) : ("free" as const),
    ideasPerSearch: 15,
  };
}

/** Keys for the product agent: Gemini (ideas), Firecrawl (web search/scrape),
 *  and the Amazon Associates tag (commission on product clicks). Env-based. */
function resolveAgentKeys() {
  return {
    geminiKey: (process.env.GOOGLE_GENERATIVE_AI_API_KEY || "").trim() || null,
    firecrawlKey: (process.env.FIRECRAWL_API_KEY || "").trim() || null,
    amazonTag: (process.env.AMAZON_ASSOCIATE_TAG || "").trim() || null,
  };
}

// ── Profiles ────────────────────────────────────────────────────────
export type ProfileInput = {
  name: string;
  relationship?: string | null;
  gender?: string | null;
  ageYears?: number | null;
  ageRange?: string | null;
  interests?: string[];
  birthday?: string | null; // yyyy-mm-dd
  freeSaturday?: string | null;
  talksAbout?: string | null;
  homeStyle?: string | null;
  spendingStyle?: string | null;
  tooMuchOf?: string | null;
  wantsButNeverBought?: string | null;
  lovedPastGifts?: string | null;
  lifeChanges?: string | null;
  hobbies?: string | null;
  neverBuyThemselves?: string | null;
  aesthetic?: string | null;
  notes?: string | null;
};

function cleanProfileData(input: ProfileInput) {
  const birthday = input.birthday ? new Date(input.birthday + "T00:00:00Z") : null;
  return {
    name: input.name.trim(),
    relationship: input.relationship || null,
    gender: input.gender?.trim() || null,
    ageYears: input.ageYears && Number.isFinite(input.ageYears) ? Math.trunc(input.ageYears) : null,
    ageRange: input.ageRange || null,
    interests: Array.isArray(input.interests) ? input.interests.filter(Boolean).slice(0, 12) : [],
    birthday: birthday && !isNaN(birthday.getTime()) ? birthday : null,
    freeSaturday: input.freeSaturday || null,
    talksAbout: input.talksAbout?.trim() || null,
    homeStyle: input.homeStyle || null,
    spendingStyle: input.spendingStyle || null,
    tooMuchOf: input.tooMuchOf?.trim() || null,
    wantsButNeverBought: input.wantsButNeverBought?.trim() || null,
    lovedPastGifts: input.lovedPastGifts?.trim() || null,
    lifeChanges: input.lifeChanges?.trim() || null,
    hobbies: input.hobbies?.trim() || null,
    neverBuyThemselves: input.neverBuyThemselves?.trim() || null,
    aesthetic: input.aesthetic || null,
    notes: input.notes?.trim() || null,
  };
}

export async function createProfile(input: ProfileInput, occasionDate?: string | null) {
  const session = await requireSession();
  if (!input.name?.trim()) throw new Error("A name is required.");

  const profile = await prisma.personProfile.create({
    data: {
      userId: session.user.id,
      ...cleanProfileData(input),
      lastEnrichedAt: new Date(),
    },
  });

  // If they gave a birthday, seed a recurring birthday occasion.
  if (profile.birthday) {
    await prisma.occasion.create({
      data: {
        userId: session.user.id,
        profileId: profile.id,
        type: "birthday",
        date: profile.birthday,
        recurring: true,
      },
    });
  }
  if (occasionDate) {
    await prisma.occasion.create({
      data: {
        userId: session.user.id,
        profileId: profile.id,
        type: "birthday",
        date: new Date(occasionDate + "T00:00:00Z"),
        recurring: true,
      },
    });
  }

  revalidatePath("/dashboard");
  return { id: profile.id };
}

export async function updateProfile(id: string, input: ProfileInput) {
  const session = await requireSession();
  const existing = await prisma.personProfile.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) throw new Error("Profile not found.");

  await prisma.personProfile.update({
    where: { id },
    data: { ...cleanProfileData(input), lastEnrichedAt: new Date() },
  });
  revalidatePath(`/dashboard/people/${id}`);
  revalidatePath("/dashboard");
  return { id };
}

export async function deleteProfile(id: string) {
  const session = await requireSession();
  const existing = await prisma.personProfile.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) throw new Error("Profile not found.");
  await prisma.personProfile.delete({ where: { id } });
  revalidatePath("/dashboard");
  return { ok: true };
}

// ── Occasions ───────────────────────────────────────────────────────
export async function addOccasion(input: {
  profileId: string;
  type: string;
  date: string;
  recurring?: boolean;
  budgetMin?: number | null;
  budgetMax?: number | null;
  notes?: string | null;
}) {
  const session = await requireSession();
  const profile = await prisma.personProfile.findFirst({
    where: { id: input.profileId, userId: session.user.id },
  });
  if (!profile) throw new Error("Profile not found.");

  await prisma.occasion.create({
    data: {
      userId: session.user.id,
      profileId: input.profileId,
      type: input.type,
      date: new Date(input.date + "T00:00:00Z"),
      recurring: input.recurring ?? true,
      budgetMin: input.budgetMin ?? null,
      budgetMax: input.budgetMax ?? null,
      notes: input.notes?.trim() || null,
    },
  });
  revalidatePath(`/dashboard/people/${input.profileId}`);
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/planner");
  return { ok: true };
}

export async function updateOccasionPlan(
  id: string,
  data: {
    budgetMin?: number | null;
    budgetMax?: number | null;
    notes?: string | null;
    done?: boolean;
    claimedBy?: string | null;
    giftStatus?: string;
  },
) {
  const session = await requireSession();
  const occ = await prisma.occasion.findFirst({ where: { id, userId: session.user.id } });
  if (!occ) throw new Error("Occasion not found.");
  await prisma.occasion.update({ where: { id }, data });
  revalidatePath("/dashboard/planner");
  revalidatePath("/dashboard/calendar");
  return { ok: true };
}

/**
 * Plan a profile's birthday that has no Occasion row yet (synthetic "bday-*"
 * planner rows). Creates the recurring birthday occasion from the profile's
 * birthday, then applies the plan fields. Returns the new occasion id so the
 * client can keep editing it.
 */
export async function planProfileBirthday(
  profileId: string,
  data: { budgetMin?: number | null; budgetMax?: number | null; notes?: string | null; giftStatus?: string },
) {
  const session = await requireSession();
  const profile = await prisma.personProfile.findFirst({ where: { id: profileId, userId: session.user.id } });
  if (!profile) throw new Error("Profile not found.");
  if (!profile.birthday) throw new Error("This person has no birthday on file.");

  const existing = await prisma.occasion.findFirst({
    where: { userId: session.user.id, profileId, type: "birthday" },
  });
  const occasion =
    existing ??
    (await prisma.occasion.create({
      data: { userId: session.user.id, profileId, type: "birthday", date: profile.birthday, recurring: true },
    }));

  await prisma.occasion.update({ where: { id: occasion.id }, data });
  revalidatePath("/dashboard/planner");
  revalidatePath("/dashboard/calendar");
  return { occasionId: occasion.id };
}

/**
 * On-demand AI generation for a single occasion (the planner's "bring me ideas"
 * / 14-day-reminder action). Reuses the normal generation pipeline with a
 * sensible tone + the planned budget, and returns the run id to open.
 */
export async function generateIdeasFor(input: {
  profileId: string;
  occasion: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
}) {
  const min = input.budgetMin ?? 25;
  const max = Math.max(input.budgetMax ?? 150, min + 1);
  return runGeneration({
    profileId: input.profileId,
    occasion: input.occasion,
    tone: "practical",
    budgetMin: min,
    budgetMax: max,
    neverBuyFilter: false,
  });
}

// ── Group gifts ─────────────────────────────────────────────────────
export type Contributor = { name: string; amount: number; paid: boolean };

export async function upsertGiftGroup(input: {
  occasionKey: string;
  profileId?: string | null;
  title: string;
}) {
  const session = await requireSession();
  const group = await prisma.giftGroup.create({
    data: {
      userId: session.user.id,
      occasionKey: input.occasionKey,
      profileId: input.profileId ?? null,
      title: input.title?.trim() || "Group gift",
    },
  });
  revalidatePath("/dashboard/planner");
  return { id: group.id };
}

export async function updateGiftGroup(
  id: string,
  data: { title?: string; targetAmount?: number | null; ordered?: boolean; contributors?: Contributor[] },
) {
  const session = await requireSession();
  const group = await prisma.giftGroup.findFirst({ where: { id, userId: session.user.id } });
  if (!group) throw new Error("Group gift not found.");
  await prisma.giftGroup.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title.trim() || "Group gift" } : {}),
      ...(data.targetAmount !== undefined ? { targetAmount: data.targetAmount } : {}),
      ...(data.ordered !== undefined ? { ordered: data.ordered } : {}),
      ...(data.contributors !== undefined
        ? { contributors: data.contributors as unknown as Prisma.InputJsonValue }
        : {}),
    },
  });
  revalidatePath("/dashboard/planner");
  return { ok: true };
}

export async function deleteGiftGroup(id: string) {
  const session = await requireSession();
  const group = await prisma.giftGroup.findFirst({ where: { id, userId: session.user.id } });
  if (!group) throw new Error("Group gift not found.");
  await prisma.giftGroup.delete({ where: { id } });
  revalidatePath("/dashboard/planner");
  return { ok: true };
}

// ── Gift plans (the "Add plan" flow) ────────────────────────────────
export type PlanRow = {
  id: string;
  profileId: string | null;
  recipientName: string;
  occasion: string;
  isGroup: boolean;
  budgetMin: number | null;
  budgetMax: number | null;
  notes: string | null;
  notifyDate: string | null; // yyyy-mm-dd
  status: string;
  runId: string | null;
};

function serializePlan(p: {
  id: string;
  profileId: string | null;
  recipientName: string;
  occasion: string;
  isGroup: boolean;
  budgetMin: number | null;
  budgetMax: number | null;
  notes: string | null;
  notifyDate: Date | null;
  status: string;
  runId: string | null;
}): PlanRow {
  return {
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
  };
}

export type GroupRow = {
  id: string;
  occasionKey: string;
  profileId: string | null;
  title: string;
  targetAmount: number | null;
  ordered: boolean;
  contributors: Contributor[];
};

export async function createGiftPlan(input: {
  profileId?: string | null;
  recipientName: string;
  occasion: string;
  isGroup: boolean;
  budgetMin?: number | null;
  budgetMax?: number | null;
  notes?: string | null;
  notifyDate?: string | null; // yyyy-mm-dd
}): Promise<{ plan: PlanRow; group: GroupRow | null }> {
  const session = await requireSession();
  const userId = session.user.id;
  if (!input.recipientName?.trim() && !input.profileId) throw new Error("Who is this gift for?");

  // Resolve the recipient name from a saved profile when one is chosen.
  let recipientName = input.recipientName?.trim() || "Someone";
  if (input.profileId) {
    const profile = await prisma.personProfile.findFirst({ where: { id: input.profileId, userId } });
    if (profile) recipientName = profile.name;
  }

  const plan = await prisma.giftPlan.create({
    data: {
      userId,
      profileId: input.profileId ?? null,
      recipientName,
      occasion: input.occasion,
      isGroup: !!input.isGroup,
      budgetMin: input.budgetMin ?? null,
      budgetMax: input.budgetMax ?? null,
      notes: input.notes?.trim() || null,
      notifyDate: input.notifyDate ? new Date(input.notifyDate + "T00:00:00Z") : null,
    },
  });

  let group: GroupRow | null = null;
  if (input.isGroup) {
    const created = await prisma.giftGroup.create({
      data: {
        userId,
        occasionKey: plan.id,
        profileId: input.profileId ?? null,
        title: `Group gift for ${recipientName}`,
        targetAmount: input.budgetMax ?? null,
      },
    });
    group = {
      id: created.id,
      occasionKey: created.occasionKey,
      profileId: created.profileId,
      title: created.title,
      targetAmount: created.targetAmount,
      ordered: created.ordered,
      contributors: [],
    };
  }

  revalidatePath("/dashboard/planner");
  return { plan: serializePlan(plan), group };
}

/** Generate fresh ideas for a saved plan and link the run to it. */
export async function generatePlanIdeas(
  planId: string,
): Promise<{ runId: string } | { paymentRequired: true }> {
  const session = await requireSession();
  const plan = await prisma.giftPlan.findFirst({ where: { id: planId, userId: session.user.id } });
  if (!plan) throw new Error("Plan not found.");
  if (!plan.profileId) throw new Error("Add this person to your people first to generate ideas.");

  const result = await generateIdeasFor({
    profileId: plan.profileId,
    occasion: plan.occasion,
    budgetMin: plan.budgetMin,
    budgetMax: plan.budgetMax,
  });
  if ("paymentRequired" in result) return result;

  await prisma.giftPlan.update({ where: { id: plan.id }, data: { runId: result.runId, status: "planned" } });
  revalidatePath("/dashboard/planner");
  return { runId: result.runId };
}

export async function updateGiftPlan(
  id: string,
  data: {
    status?: string;
    budgetMin?: number | null;
    budgetMax?: number | null;
    notes?: string | null;
    notifyDate?: string | null;
  },
) {
  const session = await requireSession();
  const plan = await prisma.giftPlan.findFirst({ where: { id, userId: session.user.id } });
  if (!plan) throw new Error("Plan not found.");
  await prisma.giftPlan.update({
    where: { id },
    data: {
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.budgetMin !== undefined ? { budgetMin: data.budgetMin } : {}),
      ...(data.budgetMax !== undefined ? { budgetMax: data.budgetMax } : {}),
      ...(data.notes !== undefined ? { notes: data.notes?.trim() || null } : {}),
      ...(data.notifyDate !== undefined
        ? { notifyDate: data.notifyDate ? new Date(data.notifyDate + "T00:00:00Z") : null }
        : {}),
    },
  });
  revalidatePath("/dashboard/planner");
  return { ok: true };
}

export async function deleteGiftPlan(id: string) {
  const session = await requireSession();
  const plan = await prisma.giftPlan.findFirst({ where: { id, userId: session.user.id } });
  if (!plan) throw new Error("Plan not found.");
  await prisma.giftGroup.deleteMany({ where: { userId: session.user.id, occasionKey: id } });
  await prisma.giftPlan.delete({ where: { id } });
  revalidatePath("/dashboard/planner");
  return { ok: true };
}

export async function deleteOccasion(id: string) {
  const session = await requireSession();
  const occ = await prisma.occasion.findFirst({ where: { id, userId: session.user.id } });
  if (!occ) throw new Error("Occasion not found.");
  await prisma.occasion.delete({ where: { id } });
  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard/planner");
  revalidatePath(`/dashboard/people/${occ.profileId}`);
  return { ok: true };
}

// ── Generation ──────────────────────────────────────────────────────
export async function runGeneration(input: {
  profileId: string;
  occasion: string;
  tone: string;
  budgetMin: number;
  budgetMax: number;
  neverBuyFilter: boolean;
}) {
  const session = await requireSession();
  const userId = session.user.id;
  const profile = await prisma.personProfile.findFirst({ where: { id: input.profileId, userId } });
  if (!profile) throw new Error("Profile not found.");

  const ent = await getEntitlements(userId);
  // Paid-only: block the (expensive) generation entirely until they subscribe.
  // Return a value (don't throw) — a thrown error crosses the server-action
  // boundary and Vercel masks it into an opaque 500, so the client can't tell
  // it apart from a real failure. The client turns this into a paywall redirect.
  if (ent.plan !== "paid") {
    return { paymentRequired: true as const };
  }

  const budgetMin = Math.max(0, Math.min(input.budgetMin, input.budgetMax));
  const budgetMax = Math.max(input.budgetMin, input.budgetMax, budgetMin + 1);

  // What's been given already — so we never repeat.
  const [vault, purchased] = await Promise.all([
    prisma.giftVaultEntry.findMany({ where: { profileId: profile.id }, select: { title: true } }),
    prisma.giftIdea.findMany({ where: { profileId: profile.id, purchased: true }, select: { name: true } }),
  ]);
  const alreadyGiven = [...vault.map((v) => v.title), ...purchased.map((p) => p.name)];

  const profileForGen: ProfileForGeneration = {
    name: profile.name,
    relationship: profile.relationship,
    gender: profile.gender,
    ageYears: profile.ageYears,
    ageRange: profile.ageRange,
    interests: profile.interests,
    freeSaturday: profile.freeSaturday,
    talksAbout: profile.talksAbout,
    homeStyle: profile.homeStyle,
    spendingStyle: profile.spendingStyle,
    tooMuchOf: profile.tooMuchOf,
    wantsButNeverBought: profile.wantsButNeverBought,
    lovedPastGifts: profile.lovedPastGifts,
    lifeChanges: profile.lifeChanges,
    hobbies: profile.hobbies,
    neverBuyThemselves: profile.neverBuyThemselves,
    aesthetic: profile.aesthetic,
    notes: profile.notes,
  };

  const keys = resolveAgentKeys();
  const result = await generateGifts(profileForGen, {
    occasion: input.occasion,
    tone: input.tone,
    budgetMin,
    budgetMax,
    neverBuyFilter: input.neverBuyFilter,
    count: ent.ideasPerSearch,
    alreadyGiven,
    geminiKey: keys.geminiKey,
  });

  // Agent step 2 — find a real, buyable product for each idea (Amazon first,
  // then other merchants), scrape its image + price, and attach affiliate tags.
  const found = await findProducts(
    result.gifts.map((g) => g.searchQuery),
    { firecrawlKey: keys.firecrawlKey, amazonTag: keys.amazonTag },
  );

  const run = await prisma.generationRun.create({
    data: {
      userId,
      profileId: profile.id,
      occasion: input.occasion,
      tone: input.tone,
      budgetMin,
      budgetMax,
      neverBuyFilter: input.neverBuyFilter,
      model: result.model,
      usedFallback: result.usedFallback,
      ideas: {
        create: result.gifts.map((g, i) => ({
          profileId: profile.id,
          position: i,
          name: g.name,
          reason: g.reason,
          about: g.about,
          searchQuery: g.searchQuery,
          buyUrl: found[i]?.buyUrl || g.buyUrl,
          imageUrl: found[i]?.imageUrl ?? null,
          imageUrls: found[i]?.imageUrls ?? [],
          productSource: found[i]?.source ?? null,
          priceText: found[i]?.priceText || g.priceText,
          estPrice: g.estPrice,
          type: g.type,
          vibe: g.vibe,
          splurgeWorthy: g.splurgeWorthy,
          cheaperAlt: g.cheaperAlt,
          premiumAlt: g.premiumAlt,
          personalTouch: g.personalTouch,
        })),
      },
    },
  });

  // They've now used the core feature — no need to send them through the
  // onboarding guide afterward. Only writes when it isn't already set.
  await prisma.user.updateMany({
    where: { id: userId, onboardingCompleted: false },
    data: { onboardingCompleted: true },
  });

  revalidatePath(`/dashboard/people/${profile.id}`);
  return { runId: run.id };
}

/** Guest flow: a signed-in user reveals the ideas they set up while logged out. */
export async function generateFromDraft(draft: {
  profile: ProfileInput;
  occasion: string;
  tone: string;
  budgetMin: number;
  budgetMax: number;
  neverBuyFilter: boolean;
}) {
  // Gate BEFORE creating the profile so an unpaid attempt doesn't leave a
  // half-finished profile behind — the draft stays saved so paying and
  // returning here reveals the ideas without a duplicate.
  const session = await requireSession();
  const ent = await getEntitlements(session.user.id);
  if (ent.plan !== "paid") return { paymentRequired: true as const };

  const { id } = await createProfile(draft.profile);
  const result = await runGeneration({
    profileId: id,
    occasion: draft.occasion,
    tone: draft.tone,
    budgetMin: draft.budgetMin,
    budgetMax: draft.budgetMax,
    neverBuyFilter: draft.neverBuyFilter,
  });
  if ("paymentRequired" in result) return result;
  return { runId: result.runId };
}

// ── Gift idea state ─────────────────────────────────────────────────
export async function setGiftSaved(id: string, saved: boolean) {
  const session = await requireSession();
  const idea = await prisma.giftIdea.findFirst({ where: { id, run: { userId: session.user.id } } });
  if (!idea) throw new Error("Not found.");
  await prisma.giftIdea.update({ where: { id }, data: { saved } });
  return { ok: true };
}

export async function setGiftTracked(id: string, trackPrice: boolean) {
  const session = await requireSession();
  const idea = await prisma.giftIdea.findFirst({ where: { id, run: { userId: session.user.id } } });
  if (!idea) throw new Error("Not found.");
  await prisma.giftIdea.update({ where: { id }, data: { trackPrice } });
  return { ok: true };
}

/** Mark a gift idea as bought — logs it into the vault (with its image + buy
 *  link) and won't be suggested again. Idempotent: re-marking won't duplicate. */
export async function markGiftPurchased(id: string, occasion?: string) {
  const session = await requireSession();
  const userId = session.user.id;
  const idea = await prisma.giftIdea.findFirst({
    where: { id, run: { userId } },
    include: { run: true },
  });
  if (!idea) throw new Error("Not found.");

  await prisma.giftIdea.update({ where: { id }, data: { purchased: true, saved: true } });

  // Only log to the vault once per idea.
  const existing = await prisma.giftVaultEntry.findFirst({ where: { userId, giftIdeaId: idea.id } });
  if (!existing) {
    await prisma.giftVaultEntry.create({
      data: {
        userId,
        profileId: idea.profileId,
        giftIdeaId: idea.id,
        title: idea.name,
        occasion: occasion || idea.run.occasion,
        year: new Date().getFullYear(),
        givenDate: new Date(),
        direction: "given",
        priceText: idea.priceText,
        imageUrl: idea.imageUrl,
        buyUrl: idea.buyUrl,
        reaction: "unknown",
      },
    });
  }
  revalidatePath("/dashboard/vault");
  return { ok: true };
}

/** Undo a purchase — unmark the idea and remove its auto-logged vault entry. */
export async function unmarkGiftPurchased(id: string) {
  const session = await requireSession();
  const userId = session.user.id;
  const idea = await prisma.giftIdea.findFirst({ where: { id, run: { userId } } });
  if (!idea) throw new Error("Not found.");

  await prisma.giftIdea.update({ where: { id }, data: { purchased: false } });
  await prisma.giftVaultEntry.deleteMany({ where: { userId, giftIdeaId: id } });
  revalidatePath("/dashboard/vault");
  return { ok: true };
}

// ── Vault ───────────────────────────────────────────────────────────
export async function addVaultEntry(input: {
  profileId: string;
  title: string;
  occasion?: string | null;
  year?: number | null;
  direction?: string;
  source?: string | null;
  reaction?: string | null;
  priceText?: string | null;
  notes?: string | null;
}) {
  const session = await requireSession();
  const profile = await prisma.personProfile.findFirst({
    where: { id: input.profileId, userId: session.user.id },
  });
  if (!profile) throw new Error("Profile not found.");
  if (!input.title?.trim()) throw new Error("What was the gift?");

  await prisma.giftVaultEntry.create({
    data: {
      userId: session.user.id,
      profileId: input.profileId,
      title: input.title.trim(),
      occasion: input.occasion || null,
      year: input.year ?? new Date().getFullYear(),
      direction: input.direction === "received" ? "received" : "given",
      source: input.source?.trim() || null,
      reaction: input.reaction || "unknown",
      priceText: input.priceText?.trim() || null,
      notes: input.notes?.trim() || null,
    },
  });
  revalidatePath("/dashboard/vault");
  revalidatePath(`/dashboard/people/${input.profileId}`);
  return { ok: true };
}

export async function deleteVaultEntry(id: string) {
  const session = await requireSession();
  const entry = await prisma.giftVaultEntry.findFirst({ where: { id, userId: session.user.id } });
  if (!entry) throw new Error("Not found.");
  await prisma.giftVaultEntry.delete({ where: { id } });
  revalidatePath("/dashboard/vault");
  return { ok: true };
}

// ── Wishlist products (add by link → scrape) ────────────────────────
export type WishlistItemRow = {
  id: string;
  url: string;
  buyUrl: string | null;
  title: string;
  imageUrl: string | null;
  priceText: string | null;
  source: string | null;
};

/** Paste a product link → scrape its title/image/price and save to the wishlist. */
export async function addWishlistItem(url: string): Promise<WishlistItemRow> {
  const session = await requireSession();
  const clean = url.trim();
  if (!/^https?:\/\/.+\..+/i.test(clean)) throw new Error("Paste a full product link (https://…).");

  const keys = resolveAgentKeys();
  const scraped = await scrapeProductUrl(clean, { firecrawlKey: keys.firecrawlKey, amazonTag: keys.amazonTag });

  const item = await prisma.wishlistItem.create({
    data: {
      userId: session.user.id,
      url: clean,
      buyUrl: scraped.buyUrl,
      title: scraped.title,
      imageUrl: scraped.imageUrl,
      priceText: scraped.priceText,
      source: scraped.source,
    },
  });
  revalidatePath("/dashboard/wishlist");
  return {
    id: item.id,
    url: item.url,
    buyUrl: item.buyUrl,
    title: item.title,
    imageUrl: item.imageUrl,
    priceText: item.priceText,
    source: item.source,
  };
}

export async function deleteWishlistItem(id: string) {
  const session = await requireSession();
  const item = await prisma.wishlistItem.findFirst({ where: { id, userId: session.user.id } });
  if (!item) throw new Error("Not found.");
  await prisma.wishlistItem.delete({ where: { id } });
  revalidatePath("/dashboard/wishlist");
  return { ok: true };
}

// ── Wishlist sharing (the viral loop) ───────────────────────────────
export async function createWishlist(input: { title: string; message?: string | null }) {
  const session = await requireSession();
  const share = await prisma.wishlistShare.create({
    data: {
      userId: session.user.id,
      title: input.title?.trim() || "Help me find your gift",
      message: input.message?.trim() || null,
    },
  });
  revalidatePath("/dashboard/wishlist");
  return { token: share.token };
}

/** Public — used by the share page. No auth. */
export async function getWishlistByToken(token: string) {
  const share = await prisma.wishlistShare.findUnique({ where: { token } });
  if (!share) return null;
  return {
    token: share.token,
    title: share.title,
    message: share.message,
    status: share.status,
  };
}

/** Public — the recipient fills in their own preferences. Creates a profile for the owner. */
export async function submitWishlist(
  token: string,
  responderName: string,
  responses: ProfileInput,
) {
  const share = await prisma.wishlistShare.findUnique({ where: { token } });
  if (!share) throw new Error("This link is no longer valid.");
  if (share.status === "filled") throw new Error("This wishlist has already been filled in.");

  const profile = await prisma.personProfile.create({
    data: {
      userId: share.userId,
      ...cleanProfileData({ ...responses, name: responderName || responses.name || "Someone" }),
      lastEnrichedAt: new Date(),
    },
  });

  await prisma.wishlistShare.update({
    where: { token },
    data: {
      status: "filled",
      responderName: responderName || null,
      responses: responses as unknown as Prisma.InputJsonValue,
      filledAt: new Date(),
      profileId: profile.id,
    },
  });
  return { ok: true };
}
