import { env } from "@Batman/env/server";
import { Resend } from "resend";

const RESEND_DEFAULT_FROM = "Batman <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[Email] Not sent: no RESEND_API_KEY.");
      return false;
    }
    const resend = new Resend(apiKey);
    const customFrom = env.RESEND_FROM_EMAIL?.trim();
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
