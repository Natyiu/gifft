"use server";

import { auth } from "@Batman/auth";
import prisma from "@Batman/db";
import { headers } from "next/headers";
import { Polar } from "@polar-sh/sdk";

import { getSubscriptionStatus } from "@/lib/subscription";
import { getCreditsRemaining, grantCredits } from "@/lib/credits";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== "admin") throw new Error("Forbidden");
  return session;
}

async function getPolarClient() {
  await requireAdmin();

  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
    select: { polarAccessToken: true, polarSandboxMode: true },
  });

  const token = (settings?.polarAccessToken || process.env.POLAR_ACCESS_TOKEN)?.trim();
  const sandbox = settings?.polarSandboxMode ?? (process.env.POLAR_SANDBOX_MODE === "false" ? false : true);

  if (!token?.trim()) {
    throw new Error("Polar is not configured. Add your access token in Admin → API Keys.");
  }

  return {
    polar: new Polar({
      accessToken: token,
      ...(sandbox && { server: "sandbox" as const }),
    }),
  };
}

async function getPolarClientForCheckout() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
    select: { polarAccessToken: true, polarSandboxMode: true },
  });

  const token = (settings?.polarAccessToken || process.env.POLAR_ACCESS_TOKEN)?.trim();
  const sandbox = settings?.polarSandboxMode ?? (process.env.POLAR_SANDBOX_MODE === "false" ? false : true);

  if (!token?.trim()) {
    return null;
  }

  return {
    polar: new Polar({
      accessToken: token,
      ...(sandbox && { server: "sandbox" as const }),
    }),
  };
}

export type PolarProduct = {
  id: string;
  name: string;
  description: string | null;
  isRecurring: boolean;
  recurringInterval: string | null;
  isArchived: boolean;
  prices: Array<{
    id: string;
    amountType: string;
    priceAmount: number | null;
    priceCurrency: string;
  }>;
  createdAt: string;
};

function mapProduct(p: {
  id: string;
  name: string;
  description: string | null;
  isRecurring: boolean;
  recurringInterval: string | null;
  isArchived: boolean;
  prices: Array<{
    id: string;
    amountType: string;
    priceAmount: number | null;
    priceCurrency: string;
  }>;
  createdAt: Date;
}): PolarProduct {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    isRecurring: p.isRecurring,
    recurringInterval: p.recurringInterval,
    isArchived: p.isArchived,
    prices: (p.prices ?? []).map((pr: { id: string; amountType: string; priceAmount: number | null; priceCurrency: string }) => ({
      id: pr.id,
      amountType: pr.amountType,
      priceAmount: pr.priceAmount,
      priceCurrency: pr.priceCurrency,
    })),
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
  };
}

export async function listPolarProducts(opts?: {
  includeArchived?: boolean;
}): Promise<{ products: PolarProduct[]; error?: string }> {
  try {
    const { polar } = await getPolarClient();

    const iterator = await polar.products.list({
      isArchived: opts?.includeArchived ? undefined : false,
    });

    const items: PolarProduct[] = [];
    for await (const page of iterator) {
      const result = (page as { result?: { items?: unknown[] } }).result;
      const listItems = result?.items ?? [];
      for (const p of listItems) {
        items.push(mapProduct(p as Parameters<typeof mapProduct>[0]));
      }
      break; // first page only
    }

    return { products: items };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list products";
    return { products: [], error: msg };
  }
}

function toCurrency(c: string): "usd" | "eur" | "gbp" {
  const lower = c.toLowerCase();
  if (lower === "eur" || lower === "gbp") return lower;
  return "usd";
}

export async function createPolarProduct(data: {
  name: string;
  description?: string;
  type: "saas-monthly" | "saas-yearly" | "one-time";
  priceAmountCents: number;
  priceCurrency?: string;
}): Promise<{ product?: PolarProduct; error?: string }> {
  try {
    const { polar } = await getPolarClient();

    const isRecurring = data.type.startsWith("saas-");
    const recurringInterval =
      data.type === "saas-monthly"
        ? ("month" as const)
        : data.type === "saas-yearly"
          ? ("year" as const)
          : null;

    const price = {
      amountType: "fixed" as const,
      priceCurrency: toCurrency(data.priceCurrency ?? "usd"),
      priceAmount: Math.max(50, data.priceAmountCents),
    };

    if (isRecurring) {
      const product = await polar.products.create({
        name: data.name,
        description: data.description ?? null,
        recurringInterval: recurringInterval!,
        recurringIntervalCount: 1,
        prices: [price],
      });
      return { product: mapProduct(product as Parameters<typeof mapProduct>[0]) };
    }

    const product = await polar.products.create({
      name: data.name,
      description: data.description ?? null,
      recurringInterval: null,
      prices: [price],
    });
    return { product: mapProduct(product as Parameters<typeof mapProduct>[0]) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create product";
    return { error: msg };
  }
}

export async function archivePolarProduct(productId: string): Promise<{ error?: string }> {
  try {
    const { polar } = await getPolarClient();
    await polar.products.update({
      id: productId,
      productUpdate: { isArchived: true },
    });
    return {};
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to archive product";
    return { error: msg };
  }
}

export async function listProductsForPricing(): Promise<{
  products: PolarProduct[];
  error?: string;
}> {
  const client = await getPolarClientForCheckout();
  if (!client) {
    return { products: [] };
  }

  try {
    const { polar } = client;
    const iterator = await polar.products.list({
      isArchived: false,
    });

    const items: PolarProduct[] = [];
    for await (const page of iterator) {
      const result = (page as { result?: { items?: unknown[] } }).result;
      const listItems = result?.items ?? [];
      for (const p of listItems) {
        items.push(mapProduct(p as Parameters<typeof mapProduct>[0]));
      }
      break;
    }
    return { products: items };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to list products";
    return { products: [], error: msg };
  }
}

export async function createCheckoutSession(
  productId: string,
  baseUrl?: string
): Promise<{ url?: string; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: "You must be logged in to subscribe" };
  }

  const client = await getPolarClientForCheckout();
  if (!client) {
    return { error: "Payments are not configured" };
  }

  try {
    const origin =
      baseUrl ||
      process.env.BETTER_AUTH_URL ||
      process.env.CORS_ORIGIN ||
      "http://localhost:3001";
    const root = origin.replace(/\/$/, "");
    // After paying, resume the gift the user was setting up and drop them on the
    // generated results (the reveal page reads their saved draft). With no draft
    // pending it just forwards to the dashboard.
    const successUrl = `${root}/start/reveal?checkout=success`;
    const returnUrl = `${root}/pricing`;

    const checkout = await client.polar.checkouts.create({
      products: [productId],
      customerEmail: session.user.email ?? undefined,
      externalCustomerId: session.user.id,
      customerName: session.user.name ?? undefined,
      successUrl,
      returnUrl,
    });

    const url = (checkout as { url?: string }).url;
    if (!url) {
      return { error: "No checkout URL returned" };
    }
    return { url };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create checkout";
    return { error: msg };
  }
}

/**
 * Reconcile the signed-in user's entitlement directly against Polar, instead of
 * waiting for the webhook. Right after checkout the webhook may be slow, not yet
 * configured, or unable to match the customer — this asks Polar's API whether
 * this user (matched by the externalCustomerId we set at checkout = their user
 * id) has an active subscription or a paid one-time order, and writes it into
 * our DB so `getEntitlements` reflects the payment immediately. Idempotent and
 * safe to call on every reveal attempt.
 */
export async function syncPolarEntitlement(): Promise<{ entitled: boolean; error?: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { entitled: false, error: "Not signed in" };
  const userId = session.user.id;
  const email = session.user.email?.toLowerCase().trim();

  const client = await getPolarClientForCheckout();
  if (!client) return { entitled: false, error: "Payments are not configured" };

  const { polar } = client;
  const pageItems = (page: unknown): Record<string, unknown>[] =>
    ((page as { result?: { items?: unknown[] } }).result?.items ?? []) as Record<string, unknown>[];

  // Match the Polar customer by the external id we set at checkout (their user
  // id), and also by email in case an older/other checkout didn't carry it.
  const filters: Array<{ externalCustomerId?: string; customerId?: string }> = [
    { externalCustomerId: userId },
  ];
  if (email) {
    try {
      const customers = await polar.customers.list({ email });
      for await (const page of customers) {
        for (const c of pageItems(page)) {
          const cid = String(c.id ?? "");
          if (cid) filters.push({ customerId: cid });
        }
        break;
      }
    } catch (e) {
      console.error("[polar sync] customers", e);
    }
  }

  for (const filter of filters) {
    // 1) Active recurring subscription → upsert into our Subscription table.
    try {
      const subs = await polar.subscriptions.list({ ...filter, active: true });
      for await (const page of subs) {
        for (const s of pageItems(page)) {
          const status = String(s.status ?? "");
          if (status !== "active" && status !== "trialing") continue;
          const record = {
            polarSubscriptionId: String(s.id ?? ""),
            polarCustomerId: String(s.customerId ?? ""),
            productId: (s.productId as string | undefined) ?? undefined,
            status,
            currentPeriodEnd: s.currentPeriodEnd ? new Date(s.currentPeriodEnd as string | Date) : new Date(0),
            cancelAtPeriodEnd: Boolean(s.cancelAtPeriodEnd),
          };
          if (record.polarSubscriptionId) {
            await prisma.subscription.upsert({
              where: { userId },
              create: { userId, ...record },
              update: record,
            });
          }
        }
        break; // first page is enough — we only need to know one is active
      }
    } catch (e) {
      console.error("[polar sync] subscriptions", e);
    }

    // 2) Paid one-time orders → grant search credits (idempotent per order).
    try {
      const orders = await polar.orders.list({ ...filter });
      for await (const page of orders) {
        for (const o of pageItems(page)) {
          if (o.subscriptionId) continue; // subscription invoice, not a one-time buy
          const paid = o.paid === true || String(o.status ?? "") === "paid";
          if (!paid) continue;
          const orderId = String(o.id ?? "");
          if (!orderId) continue;
          await grantCredits({
            userId,
            polarOrderId: orderId,
            productId: (o.productId as string | null) ?? null,
            amount: 1,
          });
        }
        break;
      }
    } catch (e) {
      console.error("[polar sync] orders", e);
    }
  }

  const { isSubscribed } = await getSubscriptionStatus(userId);
  const credits = await getCreditsRemaining(userId);
  return { entitled: isSubscribed || credits > 0 };
}

export async function updatePolarProduct(
  productId: string,
  data: { name?: string; description?: string }
): Promise<{ product?: PolarProduct; error?: string }> {
  try {
    const { polar } = await getPolarClient();

    const product = await polar.products.update({
      id: productId,
      productUpdate: {
        name: data.name,
        description: data.description ?? null,
      },
    });

    return {
      product: mapProduct(product as Parameters<typeof mapProduct>[0]),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to update product";
    return { error: msg };
  }
}
