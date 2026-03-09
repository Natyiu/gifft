import { auth } from "@Batman/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";

function BatLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 40"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M50 0C50 0 42 14 30 18C18 22 0 18 0 18C0 18 12 28 20 32C28 36 50 40 50 40C50 40 72 36 80 32C88 28 100 18 100 18C100 18 82 22 70 18C58 14 50 0 50 0Z" />
    </svg>
  );
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session?.user) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <BatLogo className="h-5 w-auto text-primary" />
              <span className="font-semibold text-sm tracking-widest uppercase">Batman</span>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary h-8">
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/3 rounded-full blur-[100px]" />
        <div className="w-full max-w-sm mx-auto px-6 relative">
          {children}
        </div>
      </main>

      <footer className="border-t border-border/30 py-6">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Batman
          </p>
        </div>
      </footer>
    </div>
  );
}
