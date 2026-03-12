import { randomBytes } from "node:crypto";
import prisma from "@Batman/db";
import { sendEmail } from "@/lib/email";

const DOWNLOAD_LINK_EXPIRY_HOURS = 48;
const MARKETING_PRODUCT_ID = process.env.POLAR_MARKETING_PRODUCT_ID?.trim();

export function isMarketingProduct(productId: string | undefined): boolean {
  return !!MARKETING_PRODUCT_ID && productId === MARKETING_PRODUCT_ID;
}

/**
 * Marketing = one-time codebase purchase (Batman.zip download).
 * Boilerplate = Pro subscription (dashboard/pro access).
 * These must never clash: subscription payments must NOT trigger download links.
 */
export async function grantCodebaseAccess(params: {
  email: string;
  polarOrderId: string;
  productId?: string;
  /** When true (e.g. from polar-marketing webhook), skip product ID check — all orders are marketing */
  forceMarketing?: boolean;
  /** Polar billing_reason: "purchase" = one-time, "subscription_create"|"subscription_cycle"|"subscription_update" = subscription. Never grant download for subscription. */
  billingReason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { email, polarOrderId, productId, forceMarketing, billingReason } = params;

  // Never grant codebase access for subscription payments (boilerplate Pro tier)
  const isSubscriptionOrder =
    billingReason === "subscription_create" ||
    billingReason === "subscription_cycle" ||
    billingReason === "subscription_update";
  if (isSubscriptionOrder) {
    return { ok: true }; // Boilerplate subscription — ignore
  }

  if (!forceMarketing && !isMarketingProduct(productId)) {
    return { ok: true }; // Not our product, ignore
  }

  const emailNorm = email?.toLowerCase().trim();
  if (!emailNorm) {
    return { ok: false, error: "No customer email" };
  }

  const downloadToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + DOWNLOAD_LINK_EXPIRY_HOURS * 60 * 60 * 1000);

  try {
    await prisma.marketingPurchase.create({
      data: {
        email: emailNorm,
        polarOrderId,
        downloadToken,
        expiresAt,
      },
    });
  } catch (e) {
    // Duplicate order - already processed
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return { ok: true };
    }
    console.error("[Marketing] Failed to create purchase:", e);
    return { ok: false, error: "Database error" };
  }

  const baseUrl =
    process.env.BETTER_AUTH_URL ||
    process.env.CORS_ORIGIN ||
    "http://localhost:3001";
  const root = baseUrl.replace(/\/$/, "");
  const downloadUrl = `${root}/api/download/access?token=${downloadToken}`;

  const html = `
    <p>Thanks for purchasing Batman!</p>
    <p>Your download link is ready. It expires in ${DOWNLOAD_LINK_EXPIRY_HOURS} hours.</p>
    <p><a href="${downloadUrl}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">Download Batman</a></p>
    <p>Or copy this link: <a href="${downloadUrl}">${downloadUrl}</a></p>
    <p>After downloading, run:</p>
    <pre style="background:#f4f4f4;padding:12px;border-radius:4px;">unzip Batman.zip && cd Batman && pnpm install && pnpm dev</pre>
    <p>If you have any questions, reply to this email.</p>
  `;

  const sent = await sendEmail(
    emailNorm,
    "Your Batman codebase download",
    html
  );

  if (!sent) {
    console.error("[Marketing] Email failed to send for order", polarOrderId, "— check RESEND_API_KEY in Vercel env");
    // Purchase is recorded; user can contact support for link
  } else {
    console.log("[Marketing] Download email sent to", emailNorm, "for order", polarOrderId);
  }

  return { ok: true };
}
