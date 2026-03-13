import prisma from "@Batman/db";
import { env } from "@Batman/env/server";
import { Resend } from "resend";

const RESEND_DEFAULT_FROM = "Batman <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
      select: { resendApiKey: true, resendFromEmail: true },
    });
    const apiKey = settings?.resendApiKey || env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[Email] Not sent: no RESEND_API_KEY. Add RESEND_API_KEY to env or Admin > API Keys.");
      return false;
    }
    const resend = new Resend(apiKey);
    // Prefer env so marketing deployment can set its own from (DB may have web app placeholder)
    const customFrom =
      env.RESEND_FROM_EMAIL?.trim() ||
      settings?.resendFromEmail?.trim();
    const from =
      customFrom && !customFrom.includes("yourdomain.com")
        ? customFrom
        : RESEND_DEFAULT_FROM;
    console.log("[Email] Sending from:", from);
    const { error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      console.error("[Email] Resend error:", JSON.stringify(error), "| from:", from);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Email] Send failed:", err);
    return false;
  }
}
