import Link from "next/link";

import { GiftMindWordmark } from "@/components/giftmind/logo";
import { RibbonOnboarding } from "@/components/giftmind/ribbon-onboarding";

export const metadata = {
  title: "Find a gift — GiftMind",
};

export default function StartPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <GiftMindWordmark className="h-6 w-auto" />
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Sign in
          </Link>
        </div>
      </header>
      <RibbonOnboarding />
    </div>
  );
}
