"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/actions/polar";

/** Starts a real Polar checkout for the given product. Logged-out users are
 *  sent to sign in first (and back to pricing afterward). */
export function SubscribeButton({
  productId,
  isLoggedIn,
  label,
  featured,
}: {
  productId: string;
  isLoggedIn: boolean;
  label: string;
  featured?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent("/pricing")}` as never);
      return;
    }
    setLoading(true);
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : undefined;
      const { url, error } = await createCheckoutSession(productId, baseUrl);
      if (error) {
        toast.error(error);
        return;
      }
      if (url) {
        window.location.href = url;
        return;
      }
      toast.error("Couldn't start checkout. Please try again.");
    } catch {
      toast.error("Something went wrong starting checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={subscribe}
      disabled={loading}
      variant={featured ? "default" : "outline"}
      className="w-full rounded-full"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {isLoggedIn ? label : "Sign in to subscribe"}
          <ArrowRight className="ml-1 h-4 w-4" />
        </>
      )}
    </Button>
  );
}
