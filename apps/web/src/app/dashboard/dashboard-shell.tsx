"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LayoutDashboard,
  Settings,
  Users,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
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

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Users", href: "/dashboard/users", icon: Users },
  { name: "Documents", href: "/dashboard/documents", icon: FileText },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: typeof authClient.$Infer.Session;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          fixed inset-y-0 left-0 z-50 w-60 transform bg-card/50 backdrop-blur-xl border-r border-border/30 transition-transform duration-200 ease-in-out
          md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex h-14 items-center justify-between px-5 border-b border-border/30">
          <Link href="/" className="flex items-center gap-2.5">
            <BatLogo className="h-4 w-auto text-primary" />
            <span className="font-semibold text-xs tracking-widest uppercase">Batman</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="p-3 space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href as string}
                className={`
                  flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors
                  ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                  }
                `}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/30">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 border border-border/30 flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary">
                {session.user?.name?.charAt(0).toUpperCase() || "B"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{session.user?.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {session.user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-xs border-border/30 hover:text-primary h-8"
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
            <LogOut className="mr-2 h-3 w-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border/30 bg-background/80 backdrop-blur-xl px-5">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 text-muted-foreground hover:text-primary"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Bell className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>

        <main className="p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}

export function DashboardHome() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Overview of your project activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Users", value: "1,234", change: "+12%", icon: Users },
          { title: "Revenue", value: "$12,345", change: "+8%", icon: FileText },
          { title: "Active", value: "573", change: "+24%", icon: Bell },
          { title: "Growth", value: "+24%", change: "+4%", icon: LayoutDashboard },
        ].map((stat) => (
          <Card key={stat.title} className="border-border/30 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-3.5 w-3.5 text-primary/60" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{stat.value}</div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/30 bg-card/50">
        <CardHeader>
          <CardTitle className="text-sm">Recent Activity</CardTitle>
          <CardDescription className="text-xs">
            Latest events across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              "New user signed up",
              "Payment processed",
              "Security audit complete",
              "New deployment triggered",
              "API key rotated",
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-primary/5 border border-border/30 flex items-center justify-center">
                  <Users className="h-3 w-3 text-primary/60" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium">{activity}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(i + 1) * 2}m ago
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
