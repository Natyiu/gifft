import Link from "next/link";
import { Check, Sparkles } from "lucide-react";

import { getSession } from "@/lib/session";
import { listProductsForPricing, type PolarProduct } from "@/lib/actions/polar";
import { parseProductDescription } from "@/lib/product-description";
import { Button } from "@/components/ui/button";
import { GiftMindWordmark } from "@/components/giftmind/logo";
import { cn } from "@/lib/utils";
import { SubscribeButton } from "./subscribe-button";

export const dynamic = "force-dynamic";

function formatPrice(p: PolarProduct): { price: string; cadence: string | null } {
  const pr = p.prices[0];
  if (!pr) return { price: "—", cadence: null };
  if (pr.amountType === "free") return { price: "Free", cadence: null };
  if (pr.priceAmount == null) return { price: "—", cadence: null };
  const amount = (pr.priceAmount / 100).toFixed(2).replace(/\.00$/, "");
  const symbol = (pr.priceCurrency ?? "usd").toLowerCase() === "usd" ? "$" : `${(pr.priceCurrency ?? "").toUpperCase()} `;
  const cadence = p.isRecurring ? (p.recurringInterval === "year" ? "/yr" : "/mo") : null;
  return { price: `${symbol}${amount}`, cadence };
}

export default async function PricingPage() {
  const session = await getSession();
  const isLoggedIn = Boolean(session?.user);
  const isAdmin = session?.user?.role === "admin";

  const { products } = await listProductsForPricing();
  // Cheapest first; feature the least-expensive recurring subscription.
  const sorted = [...products].sort(
    (a, b) => (a.prices[0]?.priceAmount ?? 0) - (b.prices[0]?.priceAmount ?? 0),
  );
  const featuredId = sorted.find((p) => p.isRecurring)?.id;

  const gridClass =
    sorted.length >= 3
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : sorted.length === 2
        ? "mx-auto max-w-3xl sm:grid-cols-2"
        : "mx-auto max-w-sm";

  return (
    <div>
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <GiftMindWordmark />
          <Link
            href={(isLoggedIn ? "/dashboard" : "/") as never}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {isLoggedIn ? "Dashboard" : "Back home"}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-14">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Cancel anytime · no surprises
          </div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">
            Pricing for every kind of gift-giver
          </h1>
          <p className="mt-3 text-muted-foreground">
            Pick the plan that fits, and reveal your personalized gift ideas.
          </p>
        </div>

        {sorted.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-serif text-xl font-semibold">Plans are on the way</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Subscriptions aren&apos;t live just yet — check back shortly.
            </p>
            {isAdmin && (
              <p className="mt-4 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                Admin: add your Polar access token in{" "}
                <Link href={"/admin/api-keys" as never} className="font-medium text-primary hover:underline">
                  API Keys
                </Link>{" "}
                and create products in{" "}
                <Link href={"/admin/products" as never} className="font-medium text-primary hover:underline">
                  Products
                </Link>
                .
              </p>
            )}
          </div>
        ) : (
          <div className={cn("grid gap-5", gridClass)}>
            {sorted.map((product) => {
              const { price, cadence } = formatPrice(product);
              const { description, features } = parseProductDescription(product.description);
              const featured = product.id === featuredId;
              return (
                <div
                  key={product.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
                    featured ? "border-primary ring-1 ring-primary/30" : "border-border",
                  )}
                >
                  {featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground">
                      Most popular
                    </span>
                  )}
                  <h2 className="font-serif text-xl font-semibold">{product.name}</h2>
                  {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                  <div className="mt-4 flex items-end gap-1">
                    <span className="font-serif text-3xl font-semibold">{price}</span>
                    {cadence && <span className="mb-1 text-sm text-muted-foreground">{cadence}</span>}
                  </div>

                  <ul className="mt-5 flex-1 space-y-2.5">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <SubscribeButton
                      productId={product.id}
                      isLoggedIn={isLoggedIn}
                      featured={featured}
                      label={product.isRecurring ? `Choose ${product.name}` : "Buy now"}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mx-auto mt-10 max-w-xl text-center text-xs text-muted-foreground">
          The quality of the ideas is the whole product — hyper-specific, genuinely thoughtful gifts with the
          reasoning behind each one. Cancel anytime.
        </p>
      </main>
    </div>
  );
}
