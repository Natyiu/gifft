import { NextRequest, NextResponse } from "next/server";
import prisma from "@Batman/db";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

import { grantCredits, revokeCredits } from "@/lib/credits";

type Payload = Record<string, unknown>;

const received = () => NextResponse.json({ received: true });

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });

    const settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
      select: { polarWebhookSecret: true },
    });

    const secret = (settings?.polarWebhookSecret || process.env.POLAR_WEBHOOK_SECRET)?.trim();
    if (!secret) {
      console.error("[Polar webhook] No webhook secret configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const event = validateEvent(body, headers, secret);
    const type = (event as { type?: string }).type;
    const data = event.data as Payload | undefined;
    if (!type || !data) return received();

    // Recurring plans → subscription table (unlimited access).
    if (type.startsWith("subscription.")) {
      await handleSubscription(data);
      return received();
    }

    // One-time plans → consumable search credits.
    if (type.startsWith("order.")) {
      await handleOrder(type, data);
      return received();
    }

    return received();
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    console.error("[Polar webhook]", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

/** Resolve the app user for a Polar payload — prefer the external customer id we
 *  pass at checkout (session.user.id), falling back to the customer email. */
async function resolveUserId(data: Payload): Promise<string | null> {
  const customer = (data.customer ?? {}) as {
    email?: string;
    external_id?: string;
    externalId?: string;
  };
  const externalId = String(
    data.external_customer_id ?? data.externalCustomerId ?? customer.external_id ?? customer.externalId ?? "",
  ).trim();
  if (externalId) {
    const byId = await prisma.user.findUnique({ where: { id: externalId }, select: { id: true } });
    if (byId) return byId.id;
  }

  const email = (customer.email ?? (data as { email?: string }).email ?? "").toLowerCase().trim();
  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (byEmail) return byEmail.id;
  }
  return null;
}

async function handleSubscription(data: Payload) {
  const userId = await resolveUserId(data);
  const subId = String(data.id ?? data.subscription_id ?? "");
  if (!userId || !subId) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Polar webhook] subscription: no user/subId in payload");
    }
    return;
  }

  const status = String(data.status ?? "active");
  const periodEndRaw = data.current_period_end ?? data.currentPeriodEnd;
  const periodEnd = periodEndRaw ? new Date(periodEndRaw as string) : new Date(0);
  const cancelAtPeriodEnd = Boolean(data.cancel_at_period_end ?? data.cancelAtPeriodEnd);
  const productId = (data.product_id ?? data.productId) as string | undefined;
  const customerId = String(data.customer_id ?? data.customerId ?? "");

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      polarSubscriptionId: subId,
      polarCustomerId: customerId,
      productId,
      status,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd,
    },
    update: {
      polarSubscriptionId: subId,
      polarCustomerId: customerId,
      productId,
      status,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd,
    },
  });
}

async function handleOrder(type: string, data: Payload) {
  const orderId = String(data.id ?? "").trim();
  if (!orderId) return;

  // Subscription invoices/renewals also arrive as orders — those are handled by
  // the subscription.* events, so skip any order tied to a subscription.
  const subscriptionId =
    data.subscription_id ??
    data.subscriptionId ??
    (data.subscription as { id?: string } | undefined)?.id;
  if (subscriptionId) return;

  const userId = await resolveUserId(data);
  if (!userId) return;

  if (type === "order.refunded") {
    await revokeCredits(orderId);
    return;
  }

  // Only grant once money is actually captured.
  const paid =
    type === "order.paid" || data.paid === true || String(data.status ?? "") === "paid";
  if (!paid) return;

  const productId = (data.product_id ?? data.productId) as string | undefined;
  await grantCredits({
    userId,
    polarOrderId: orderId,
    productId: productId ?? null,
    amount: creditsFromOrder(data),
  });
}

/** How many search credits a one-time order grants. Defaults to 1 (a single
 *  search), but a product/order can grant a multi-search pack by setting
 *  `metadata.credits` on the Polar product or checkout. */
function creditsFromOrder(data: Payload): number {
  const meta = (data.metadata ?? {}) as Record<string, unknown>;
  const metaCredits = Number(meta.credits);
  if (Number.isFinite(metaCredits) && metaCredits > 0) return Math.floor(metaCredits);
  return 1;
}
