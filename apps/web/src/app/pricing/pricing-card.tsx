"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { createCheckoutSession } from "@/lib/actions/polar";
import type { PolarProduct } from "@/lib/actions/polar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatPrice(p: {
  priceAmount: number | null;
  priceCurrency: string;
  amountType: string;
}): string {
  if (p.amountType === "free") return "Free";
  if (p.priceAmount != null) {
    const amount = (p.priceAmount / 100).toFixed(2);
    const curr = (p.priceCurrency ?? "usd").toUpperCase();
    return `${curr} ${amount}`;
  }
  return "—";
}

export function PricingCard({
  product,
  isLoggedIn,
}: {
  product: PolarProduct;
  isLoggedIn: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const primaryPrice = product.prices[0];
  const priceStr = primaryPrice ? formatPrice(primaryPrice) : "—";

  async function handleSubscribe() {
    if (!isLoggedIn) {
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    setLoading(true);
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : undefined;
      const result = await createCheckoutSession(product.id, baseUrl);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-border/40 bg-card/50 rounded-lg p-6 flex flex-col">
      <div className="flex-1">
        <h3 className="text-sm font-semibold">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
            {product.description}
          </p>
        )}

        <div className="mt-4">
          <span className="text-2xl font-bold">{priceStr}</span>
          {product.isRecurring && (
            <span className="text-xs text-muted-foreground ml-1">
              /{product.recurringInterval === "month" ? "month" : "year"}
            </span>
          )}
        </div>

        {product.prices.length > 1 && (
          <p className="text-[10px] text-muted-foreground mt-1">
            {product.prices.length} price options
          </p>
        )}
      </div>

      <div className="mt-6">
        <Button
          className="w-full"
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isLoggedIn ? (
            "Subscribe"
          ) : (
            "Sign in to subscribe"
          )}
        </Button>
      </div>
    </div>
  );
}
