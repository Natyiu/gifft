"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bell,
  Settings2,
  ToggleRight,
  Key,
  BarChart3,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";

const adminNav = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Notifications", href: "/admin/notifications", icon: Bell },
  { name: "Feedback", href: "/admin/feedback", icon: MessageSquare },
  { name: "General", href: "/admin/general", icon: Settings2 },
  { name: "Features", href: "/admin/features", icon: ToggleRight },
  { name: "API Keys", href: "/admin/api-keys", icon: Key },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-48 shrink-0 border-r border-border bg-card/30 hidden md:flex flex-col fixed inset-y-0 left-0 z-40">
      <div className="p-3 border-b border-border">
        <Link
          href={"/dashboard" as never}
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to app
        </Link>
      </div>

      <div className="px-3 pt-4 pb-2">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
          Admin
        </p>
      </div>

      <nav className="px-2 space-y-px flex-1">
        {adminNav.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href as never}
              className={`
                flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium transition-colors
                ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AdminMobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden flex gap-1 overflow-x-auto border-b border-border/30 pb-px mb-4 -mx-1 px-1">
      {adminNav.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href as never}
            className={`
              shrink-0 px-2.5 py-1.5 text-[10px] font-medium transition-colors -mb-px
              ${
                isActive
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }
            `}
          >
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}
