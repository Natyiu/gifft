import { auth } from "@Batman/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreditCard } from "lucide-react";

import { listProductsForPricing } from "@/lib/actions/polar";
import { getSubscriptionStatus } from "@/lib/subscription";
import { Button } from "@/components/ui/button";
import { PricingCard } from "./pricing-card";

export default async function PricingPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const { products, error } = await listProductsForPricing();

  const isSubscribed = session?.user
    ? (await getSubscriptionStatus(session.user.id)).isSubscribed
    : false;

  if (isSubscribed) {
    redirect("/dashboard/pro" as never);
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-12">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Pricing
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
            Choose the plan that works for you. Cancel anytime.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 border border-destructive/30 bg-destructive/5 rounded-lg text-center">
            <p className="text-sm text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure Polar in Admin → API Keys (Products → API Keys).
            </p>
          </div>
        )}

        {products.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border rounded-lg">
            <CreditCard className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-sm text-muted-foreground text-center">
              No products configured yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Create products in Admin → Products to display them here.
            </p>
            {session?.user && (
              <Button asChild variant="outline" className="mt-6">
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <PricingCard
                key={product.id}
                product={product}
                isLoggedIn={!!session?.user}
              />
            ))}
          </div>
        )}

        {products.length > 0 && !session?.user && (
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Sign in to subscribe
            </p>
            <div className="flex gap-2 justify-center">
              <Button asChild>
                <Link href="/login?callbackUrl=/pricing">Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/signup?callbackUrl=/pricing">Sign up</Link>
              </Button>
            </div>
          </div>
        )}

        {products.length > 0 && session?.user && (
          <div className="mt-12 text-center">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
