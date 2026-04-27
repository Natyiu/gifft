import { sendEmail } from "@/lib/email";
import { createDownloadToken } from "@/lib/download-token";

const MARKETING_PRODUCT_ID = process.env.POLAR_MARKETING_PRODUCT_ID?.trim();

export function isMarketingProduct(productId: string | undefined): boolean {
  return !!MARKETING_PRODUCT_ID && productId === MARKETING_PRODUCT_ID;
}

export async function grantCodebaseAccess(params: {
  email: string;
  polarOrderId: string;
  productId?: string;
  forceMarketing?: boolean;
  billingReason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { email, polarOrderId, productId, forceMarketing, billingReason } = params;

  const isSubscriptionOrder =
    billingReason === "subscription_create" ||
    billingReason === "subscription_cycle" ||
    billingReason === "subscription_update";
  if (isSubscriptionOrder) return { ok: true };

  if (!forceMarketing && !isMarketingProduct(productId)) return { ok: true };

  const emailNorm = email?.toLowerCase().trim();
  if (!emailNorm) return { ok: false, error: "No customer email" };

  const downloadToken = createDownloadToken(emailNorm);

  const baseUrl =
    process.env.MARKETING_URL ||
    process.env.BETTER_AUTH_URL ||
    process.env.CORS_ORIGIN ||
    "http://localhost:3002";
  const root = baseUrl.replace(/\/$/, "");
  const downloadUrl = `${root}/api/download/access?token=${downloadToken}`;

  const html = `
    <p>Thanks for purchasing Batman!</p>
    <p>Your download link is ready. It expires in 48 hours.</p>
    <p><a href="${downloadUrl}" style="display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:6px;">Download Batman</a></p>
    <p>Or copy this link: <a href="${downloadUrl}">${downloadUrl}</a></p>
    <p>After downloading, run:</p>
    <pre style="background:#f4f4f4;padding:12px;border-radius:4px;">unzip Batman.zip && cd Batman && pnpm install && pnpm dev</pre>
    <p>If you have any questions, reply to this email.</p>
  `;

  const sent = await sendEmail(emailNorm, "Your Batman codebase download", html);

  if (!sent) {
    console.error("[Marketing] Email failed to send for order", polarOrderId, "— check RESEND_API_KEY");
  } else {
    console.log("[Marketing] Download email sent to", emailNorm, "for order", polarOrderId);
  }

  return { ok: true };
}
