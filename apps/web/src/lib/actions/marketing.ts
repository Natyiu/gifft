import { randomBytes } from "node:crypto";
import prisma from "@Batman/db";
import { sendEmail } from "@/lib/email";

const DOWNLOAD_LINK_EXPIRY_HOURS = 48;
const MARKETING_PRODUCT_ID = process.env.POLAR_MARKETING_PRODUCT_ID?.trim();

export function isMarketingProduct(productId: string | undefined): boolean {
  return !!MARKETING_PRODUCT_ID && productId === MARKETING_PRODUCT_ID;
}

export async function grantCodebaseAccess(params: {
  email: string;
  polarOrderId: string;
  productId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const { email, polarOrderId, productId } = params;

  if (!isMarketingProduct(productId)) {
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
    console.error("[Marketing] Email failed to send for order", polarOrderId);
    // Purchase is recorded; user can contact support for link
  }

  return { ok: true };
}
