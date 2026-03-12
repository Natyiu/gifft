/**
 * Webhook for marketing Polar org (one-time codebase purchases).
 * Configure this URL in your marketing Polar dashboard if you use a separate
 * Polar org from the main boilerplate's Polar config.
 *
 * URL: https://yoursite.com/api/webhooks/polar-marketing
 * Secret: POLAR_MARKETING_WEBHOOK_SECRET or POLAR_WEBHOOK_SECRET
 */
import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

import { grantCodebaseAccess } from "@/lib/actions/marketing";

function extractOrderEmail(data: Record<string, unknown>): string | undefined {
  const customer = data.customer as Record<string, unknown> | undefined;
  const buyer = data.buyer as Record<string, unknown> | undefined;
  const email =
    (customer?.email as string) ??
    (data.email as string) ??
    (data.customer_email as string) ??
    (customer?.billing_email as string) ??
    (buyer?.email as string);
  return typeof email === "string" && email.trim() ? email.trim() : undefined;
}

function extractProductId(data: Record<string, unknown>): string | undefined {
  const items = (data.order_items ?? data.items) as Array<{ product_id?: string }> | undefined;
  const id = items?.[0]?.product_id ?? (data.product_id as string);
  return typeof id === "string" ? id : undefined;
}

function extractBillingReason(data: Record<string, unknown>): string | undefined {
  return data.billing_reason as string | undefined;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const headers: Record<string, string> = {};
    req.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });

    const secret = (
      process.env.POLAR_MARKETING_WEBHOOK_SECRET || process.env.POLAR_WEBHOOK_SECRET
    )?.trim();
    if (!secret) {
      console.error("[Polar marketing webhook] No webhook secret configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const event = validateEvent(body, headers, secret);
    const type = (event as { type?: string }).type;
    const data = event.data as Record<string, unknown> | undefined;

    if (type !== "order.paid" || !data) {
      return NextResponse.json({ received: true });
    }

    const email = extractOrderEmail(data);
    const orderId = String(data.id ?? "");
    const productId = extractProductId(data);
    const billingReason = extractBillingReason(data);

    // Safety: marketing webhook should only receive one-time purchases, but guard anyway
    if (
      billingReason === "subscription_create" ||
      billingReason === "subscription_cycle" ||
      billingReason === "subscription_update"
    ) {
      return NextResponse.json({ received: true }); // Subscription order — wrong webhook, ignore
    }

    if (!email) {
      console.error("[Polar marketing] No email in order.paid payload. Keys:", Object.keys(data).join(", "));
      return NextResponse.json({ received: true });
    }
    if (!orderId) {
      console.error("[Polar marketing] No order id in payload");
      return NextResponse.json({ received: true });
    }

    await grantCodebaseAccess({
      email,
      polarOrderId: orderId,
      productId,
      forceMarketing: true, // Dedicated marketing webhook — all orders are codebase purchases
      billingReason,
    });

    return NextResponse.json({ received: true });
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    console.error("[Polar marketing webhook]", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
