import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { getWishlistByToken } from "@/lib/actions/giftmind";
import { GiftMindWordmark } from "@/components/giftmind/logo";
import { WishlistPublicForm } from "@/components/giftmind/wishlist-public-form";

export const dynamic = "force-dynamic";

export default async function PublicWishlistPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = await getWishlistByToken(token);
  if (!share) notFound();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="mx-auto flex h-14 max-w-2xl items-center px-5">
          <GiftMindWordmark />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-5 py-12">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-3xl font-semibold tracking-tight">{share.title}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {share.message ||
              "Someone wants to find you a gift you'll actually love. Tell them a little about yourself — it takes two minutes."}
          </p>
        </div>

        {share.status === "filled" ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-primary" />
            <p className="font-serif text-xl font-semibold">All done</p>
            <p className="mt-1 text-sm text-muted-foreground">This wishlist has already been filled in. Thank you!</p>
          </div>
        ) : (
          <WishlistPublicForm token={token} />
        )}
      </main>
    </div>
  );
}
