import { createHmac, timingSafeEqual } from "node:crypto";

const DOWNLOAD_LINK_EXPIRY_HOURS = 48;

function getTokenSecret(): string {
  const secret =
    process.env.MARKETING_DOWNLOAD_TOKEN_SECRET ||
    process.env.POLAR_MARKETING_WEBHOOK_SECRET ||
    process.env.BETTER_AUTH_SECRET;
  if (!secret?.trim()) {
    throw new Error(
      "No token secret configured. Set MARKETING_DOWNLOAD_TOKEN_SECRET (preferred) or POLAR_MARKETING_WEBHOOK_SECRET.",
    );
  }
  return secret.trim();
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(payload: string): string {
  return createHmac("sha256", getTokenSecret()).update(payload).digest("base64url");
}

export function createDownloadToken(email: string, expiresAtMs?: number): string {
  const exp = expiresAtMs ?? Date.now() + DOWNLOAD_LINK_EXPIRY_HOURS * 60 * 60 * 1000;
  const payload = JSON.stringify({ email, exp });
  const encodedPayload = base64UrlEncode(payload);
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyDownloadToken(
  token: string,
): { valid: boolean; email?: string; expired?: boolean } {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return { valid: false };

  const expected = signPayload(encodedPayload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { valid: false };

  let payloadRaw: string;
  try {
    payloadRaw = base64UrlDecode(encodedPayload);
  } catch {
    return { valid: false };
  }

  try {
    const parsed = JSON.parse(payloadRaw) as { email?: string; exp?: number };
    if (typeof parsed.email !== "string" || typeof parsed.exp !== "number") return { valid: false };
    if (Date.now() > parsed.exp) return { valid: false, expired: true };
    return { valid: true, email: parsed.email.toLowerCase().trim() };
  } catch {
    return { valid: false };
  }
}

