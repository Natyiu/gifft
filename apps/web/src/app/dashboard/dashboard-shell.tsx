"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  ShieldCheck,
  Bell,
  Settings,
  Building2,
  Code,
  ArrowUpRight,
  MessageSquarePlus,
  User,
  CreditCard,
  LayoutDashboard,
  Compass,
  Users,
  CalendarDays,
  ClipboardList,
  Archive,
  Gift,
  ChevronsUpDown,
  Menu,
  X,
} from "lucide-react";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { GiftMindMark } from "@/components/giftmind/logo";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_GROUPS = [
  {
    label: "Main menu",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/discover", label: "Discover", icon: Compass },
      { href: "/dashboard/people", label: "People", icon: Users },
    ],
  },
  {
    label: "Plan",
    items: [
      { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/dashboard/planner", label: "Planner", icon: ClipboardList },
      { href: "/dashboard/vault", label: "Vault", icon: Archive },
      { href: "/dashboard/wishlist", label: "Wishlist", icon: Gift },
    ],
  },
];

// Native-style bottom tab bar (mobile). Four primary destinations + a "More"
// sheet that holds everything else, so each page feels like its own app screen.
const BOTTOM_NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/discover", label: "Discover", icon: Compass },
  { href: "/dashboard/people", label: "People", icon: Users },
  { href: "/dashboard/planner", label: "Planner", icon: ClipboardList },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Gift },
];
const MORE_NAV = [
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/vault", label: "Vault", icon: Archive },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

function greetingFor(hour: number) {
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

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
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [greeting, setGreeting] = useState("Good Afternoon");
  const [moreOpen, setMoreOpen] = useState(false);
  const isAdmin = session.user.role === "admin";
  const userImage = session.user.image;
  const userName = session.user.name ?? "";
  const userEmail = session.user.email ?? "";
  const firstName = userName.split(" ")[0] || "there";
  const initial = userName.charAt(0).toUpperCase() || "?";

  useEffect(() => setGreeting(greetingFor(new Date().getHours())), []);
  useEffect(() => setMoreOpen(false), [pathname]);

  function signOut() {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  }

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  }

  const profileMenu = (
    <DropdownMenuContent align="start" className="w-56 rounded-2xl">
      <DropdownMenuGroup>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
        </DropdownMenuLabel>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => (window.location.href = "/dashboard/settings")}>
        <Settings className="h-3.5 w-3.5" /> Settings
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => (window.location.href = "/dashboard/settings/account")}>
        <User className="h-3.5 w-3.5" /> Account
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setFeedbackOpen(true)}>
        <MessageSquarePlus className="h-3.5 w-3.5" /> Send Feedback
      </DropdownMenuItem>
      {isAdmin && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => (window.location.href = "/admin")}>
            <ShieldCheck className="h-3.5 w-3.5" /> Admin Dashboard
          </DropdownMenuItem>
        </>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={signOut}>
        <LogOut className="h-3.5 w-3.5" /> Sign out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar px-3 py-4 lg:flex">
        {/* Profile chip */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex w-full items-center gap-2.5 rounded-2xl border border-sidebar-border bg-card/50 px-3 py-2.5 text-left transition-colors hover:bg-card">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={userImage ?? "https://i.pravatar.cc/120?img=68"} />
                  <AvatarFallback className="bg-primary/15 text-sm font-bold text-primary">{initial}</AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{userName || "Account"}</span>
                  <span className="block truncate text-xs text-muted-foreground">{userEmail}</span>
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            }
          />
          {profileMenu}
        </DropdownMenu>

        {/* Nav groups */}
        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href as never}
                      className={cn(
                        "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-secondary font-semibold text-foreground before:absolute before:left-0 before:top-1/2 before:h-6 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-primary"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                      )}
                    >
                      <item.icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <button
          onClick={signOut}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          <LogOut className="h-5 w-5" /> Logout
        </button>
      </aside>

      {/* Main column */}
      <div className="min-w-0 flex-1 px-4 pt-6 pb-24 md:px-8 md:pt-8 lg:pb-6">
        {/* Top bar */}
        <header
          className={cn(
            "flex items-center justify-between gap-3",
            pathname === "/dashboard" ? "mb-6" : "mb-2",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <GiftMindMark className="h-7 w-7" />
            </Link>
            {pathname === "/dashboard" && (
              <h1 className="truncate text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {greeting}, {firstName}
              </h1>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <Link href={"/dashboard/notifications" as never} className="relative">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
              </Button>
              {unreadNotifications > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </Link>
            {/* Hamburger — opens the overflow menu (mobile only) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMoreOpen(true)}
              aria-label="Open menu"
              className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main>{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
          {BOTTOM_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as never}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className={cn("h-[22px] w-[22px]", active && "fill-primary/10")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile hamburger drawer */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setMoreOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 flex w-72 max-w-[82%] flex-col border-l border-border bg-background shadow-2xl">
            {/* Profile header */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userImage ?? "https://i.pravatar.cc/120?img=68"} />
                <AvatarFallback className="bg-primary/15 text-sm font-bold text-primary">{initial}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{userName || "Account"}</p>
                <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <button
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto p-3">
              {MORE_NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href as never}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                      active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", active && "text-primary")} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setMoreOpen(false);
                  setFeedbackOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                <MessageSquarePlus className="h-5 w-5" /> Send Feedback
              </button>
              {isAdmin && (
                <Link
                  href={"/admin" as never}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                >
                  <ShieldCheck className="h-5 w-5" /> Admin Dashboard
                </Link>
              )}
            </nav>

            {/* Logout */}
            <div className="border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <button
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                <LogOut className="h-5 w-5" /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}

export function DashboardHome({
  userName,
  organizationsEnabled = false,
}: {
  userName?: string;
  organizationsEnabled?: boolean;
}) {
  const firstName = userName?.split(" ")[0] ?? "there";

  const features = [
    {
      label: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
      desc: "In-app messaging with tags, filters, and read tracking",
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      desc: "Profile, account, appearance, and password",
    },
    {
      label: "Pro",
      href: "/dashboard/pro",
      icon: CreditCard,
      desc: "Subscription-protected premium features",
    },
    ...(organizationsEnabled
      ? [
          {
            label: "Organizations",
            href: "/dashboard/organizations",
            icon: Building2,
            desc: "Teams, members, roles, and invitations",
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-4xl relative">
      <div className="mb-6">
        <p className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-widest mb-1">
          User Dashboard
        </p>
        <h1 className="text-xl font-semibold tracking-tight">
          Hey, {firstName}
        </h1>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          These are the features that come built-in. Build your product
          on top of them.
        </p>
      </div>

      <div className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-3">
          Features included
        </p>
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${features.length}, minmax(0, 1fr))` }}
        >
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href as never}
              className="flex flex-col justify-between gap-2 p-3 group border border-dashed border-border/40 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <f.icon className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground/70 transition-colors" />
                <ArrowUpRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-foreground/80 transition-colors" />
              </div>
              <div>
                <p className="text-xs font-medium group-hover:text-foreground transition-colors">
                  {f.label}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-snug">
                  {f.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="border border-dashed border-border/40 px-4 py-4 mb-16">
        <div className="flex items-start gap-2">
          <Code className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-foreground/80">
              Start building
            </p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
              Edit{" "}
              <code className="bg-muted px-1.5 py-0.5 rounded-sm font-mono text-xs">
                app/dashboard/page.tsx
              </code>{" "}
              to replace this page with your product&apos;s home experience.
              The layout, auth, and features above are ready to use.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Feedback */}
      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50">
        <div className="bg-background border border-border/40 shadow-xl overflow-hidden flex items-center">
          <FeedbackDialog />
        </div>
      </div>
    </div>
  );
}
