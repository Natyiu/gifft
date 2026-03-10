"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import {
  Home,
  Settings,
  Bell,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Upload,
  ArrowUpRight,
  Search,
  Command,
  Building2,
} from "lucide-react";
import { useState } from "react";

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

const baseNavigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Files", href: "/dashboard/files", icon: Upload },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

const adminNavigation = [
  { name: "Admin", href: "/admin", icon: ShieldCheck },
];

export function DashboardShell({
  children,
  session,
  unreadNotifications = 0,
  organizationsEnabled = false,
}: {
  children: React.ReactNode;
  session: typeof authClient.$Infer.Session;
  unreadNotifications?: number;
  organizationsEnabled?: boolean;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = session.user.role === "admin";

  const navigation = organizationsEnabled
    ? [
        ...baseNavigation.slice(0, 2),
        { name: "Organizations", href: "/dashboard/organizations", icon: Building2 },
        ...baseNavigation.slice(2),
      ]
    : baseNavigation;

  return (
    <div className="min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-56 transform bg-card border-r border-border transition-transform duration-200 ease-in-out
          md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-12 items-center justify-between px-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <BatLogo className="h-3.5 w-auto text-primary" />
            <span className="font-semibold text-[11px] tracking-widest uppercase">
              Batman
            </span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex flex-col h-[calc(100%-3rem)] justify-between">
          <nav className="p-2 space-y-px">
            {navigation.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              const showBadge =
                item.name === "Notifications" && unreadNotifications > 0;
              return (
                <Link
                  key={item.name}
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
                  <span className="flex-1">{item.name}</span>
                  {showBadge && (
                    <span
                      className={`text-[8px] font-bold min-w-[16px] text-center px-1 py-px ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {unreadNotifications > 99 ? "99+" : unreadNotifications}
                    </span>
                  )}
                </Link>
              );
            })}

            {isAdmin && (
              <>
                <div className="pt-3 pb-1 px-2.5">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Admin
                  </p>
                </div>
                {adminNavigation.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.name}
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
              </>
            )}
          </nav>

          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="h-7 w-7 bg-primary/10 border border-border flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-primary">
                  {session.user?.name?.charAt(0).toUpperCase() || "B"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-[11px] font-medium truncate">
                    {session.user?.name}
                  </p>
                  {isAdmin && (
                    <span className="text-[8px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1 py-px">
                      Admin
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground truncate">
                  {session.user?.email}
                </p>
              </div>
            </div>
            <button
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-medium"
              onClick={() =>
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      window.location.href = "/";
                    },
                  },
                })
              }
            >
              <LogOut className="h-3 w-3" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="md:pl-56">
        <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border bg-background/95 backdrop-blur-sm px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1 text-muted-foreground hover:text-foreground"
          >
            <Menu className="h-3.5 w-3.5" />
          </button>

          <div className="hidden md:flex items-center gap-1.5 text-muted-foreground bg-muted px-2.5 py-1 text-[11px] cursor-default">
            <Search className="h-3 w-3" />
            <span>Search...</span>
            <kbd className="ml-4 inline-flex items-center gap-0.5 text-[9px] text-muted-foreground/60 font-mono">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-0.5">
            <Link href={"/dashboard/notifications" as never} className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <Bell className="h-3.5 w-3.5" />
              </Button>
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-[14px] flex items-center justify-center bg-primary text-primary-foreground text-[8px] font-bold px-0.5">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </Link>
            <Link href={"/dashboard/settings" as never}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </header>

        <main className="p-5 md:p-8 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}

export function DashboardHome({
  userName,
}: {
  userName?: string;
}) {
  const firstName = userName?.split(" ")[0] ?? "there";

  const quickActions = [
    {
      label: "Upload a file",
      href: "/dashboard/files",
      icon: Upload,
    },
    {
      label: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
    },
    {
      label: "Edit profile",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const shortcuts = [
    { label: "Files", href: "/dashboard/files", desc: "Upload & manage" },
    { label: "Notifications", href: "/dashboard/notifications", desc: "Messages & alerts" },
    { label: "Settings", href: "/dashboard/settings", desc: "Account & profile" },
  ];

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          Hey, {firstName}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Here&apos;s your workspace. Pick up where you left off.
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickActions.map((action) => (
          <Link
            key={action.label}
            href={action.href as never}
            className="group flex items-center gap-3 border border-border p-4 bg-card hover:bg-muted/50 transition-colors"
          >
            <div className="h-8 w-8 bg-primary/5 border border-border flex items-center justify-center shrink-0">
              <action.icon className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{action.label}</p>
            </div>
            <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ))}
      </div>

      {/* Shortcuts grid */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Go to
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
          {shortcuts.map((s) => (
            <Link
              key={s.label}
              href={s.href as never}
              className="group bg-card p-4 hover:bg-muted/50 transition-colors"
            >
              <p className="text-xs font-medium group-hover:text-primary transition-colors">
                {s.label}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {s.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting started */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Getting started
        </h2>
        <div className="border border-border divide-y divide-border">
          {[
            { text: "Complete your profile", href: "/dashboard/settings", done: false },
            { text: "Upload your first file", href: "/dashboard/files", done: false },
            { text: "Explore notifications", href: "/dashboard/notifications", done: false },
          ].map((item) => (
            <Link
              key={item.text}
              href={item.href as never}
              className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 border border-border flex items-center justify-center">
                  {item.done && (
                    <div className="h-2 w-2 bg-primary" />
                  )}
                </div>
                <span className="text-xs font-medium">{item.text}</span>
              </div>
              <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
