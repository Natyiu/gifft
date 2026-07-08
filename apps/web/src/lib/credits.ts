import prisma from "@Batman/db";

/**
 * Search credits from one-time purchases. A recurring subscription grants
 * unlimited access and never touches credits; one-time products grant a
 * consumable balance instead. This module is the single source of truth for
 * reading, spending, granting, and revoking that balance.
 */

/** Total unspent credits across all of a user's one-time purchases. */
export async function getCreditsRemaining(userId: string): Promise<number> {
  const agg = await prisma.giftCredit.aggregate({
    where: { userId, remaining: { gt: 0 } },
    _sum: { remaining: true },
  });
  return agg._sum.remaining ?? 0;
}

/**
 * Spend exactly one credit (oldest purchase first). Returns true if one was
 * spent, false if the balance was empty. The guarded `updateMany` makes this
 * safe under concurrent generations — two callers can't drive `remaining`
 * below zero.
 */
export async function consumeCredit(userId: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.giftCredit.findFirst({
      where: { userId, remaining: { gt: 0 } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!row) return false;
    const res = await tx.giftCredit.updateMany({
      where: { id: row.id, remaining: { gt: 0 } },
      data: { remaining: { decrement: 1 } },
    });
    return res.count === 1;
  });
}

/**
 * Grant credits for a paid one-time order. Idempotent on `polarOrderId`: the
 * webhook may deliver the same order more than once (or as both
 * `order.created` and `order.paid`), and we must never double-grant.
 */
export async function grantCredits(input: {
  userId: string;
  polarOrderId: string;
  productId?: string | null;
  amount: number;
}): Promise<void> {
  const amount = Math.max(1, Math.floor(input.amount) || 1);
  await prisma.giftCredit.upsert({
    where: { polarOrderId: input.polarOrderId },
    create: {
      userId: input.userId,
      polarOrderId: input.polarOrderId,
      productId: input.productId ?? null,
      granted: amount,
      remaining: amount,
    },
    // Already recorded — leave the existing balance untouched.
    update: {},
  });
}

/** Void any remaining credits from a refunded order. */
export async function revokeCredits(polarOrderId: string): Promise<void> {
  await prisma.giftCredit.updateMany({
    where: { polarOrderId },
    data: { remaining: 0 },
  });
}
