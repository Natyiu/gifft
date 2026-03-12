import { Polar } from "@polar-sh/sdk";

export async function createMarketingCheckout(baseUrl?: string): Promise<{ url?: string; error?: string }> {
  const productId = process.env.POLAR_MARKETING_PRODUCT_ID?.trim();
  const token = process.env.POLAR_MARKETING_ACCESS_TOKEN?.trim();
  const sandbox = process.env.POLAR_MARKETING_SANDBOX === "true";

  if (!productId) return { error: "Marketing product not configured (POLAR_MARKETING_PRODUCT_ID)" };
  if (!token) return { error: "Marketing Polar not configured (POLAR_MARKETING_ACCESS_TOKEN)" };

  try {
    const polar = new Polar({
      accessToken: token,
      ...(sandbox && { server: "sandbox" as const }),
    });

    const origin =
      baseUrl ||
      process.env.MARKETING_URL ||
      process.env.BETTER_AUTH_URL ||
      process.env.CORS_ORIGIN ||
      "http://localhost:3002";
    const root = origin.replace(/\/$/, "");

    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: `${root}/?checkout=success`,
      returnUrl: root,
    });

    const url = (checkout as { url?: string }).url;
    if (!url) return { error: "No checkout URL returned" };
    return { url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create checkout";
    const cause = e instanceof Error && e.cause instanceof Error ? e.cause.message : "";
    console.error("[Marketing checkout] Polar API error:", msg, cause || "");
    if (msg.includes("Product does not exist")) {
      return {
        error: "Product not found. Check POLAR_MARKETING_PRODUCT_ID and POLAR_MARKETING_SANDBOX match your Polar dashboard.",
      };
    }
    if (msg.includes("fetch failed") || msg.includes("Unable to make request")) {
      return {
        error: "Network error reaching Polar. Check your connection, firewall, or try POLAR_MARKETING_SANDBOX=true if using sandbox.",
      };
    }
    return { error: msg };
  }
}
