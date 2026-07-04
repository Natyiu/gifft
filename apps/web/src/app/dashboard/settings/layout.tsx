"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const settingsNav = [
  { name: "Profile", href: "/dashboard/settings" },
  { name: "Account", href: "/dashboard/settings/account" },
  { name: "Appearance", href: "/dashboard/settings/appearance" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight">
          <Settings className="h-6 w-6 text-primary" /> Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="mb-6 inline-flex rounded-full bg-muted p-1">
        {settingsNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href as never}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-colors sm:text-sm",
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}
