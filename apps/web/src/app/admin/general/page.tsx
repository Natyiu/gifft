"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  Users,
  Activity,
  Bell,
  ArrowRight,
  Settings2,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

import { getAppSettings } from "@/lib/actions/user";
import { updateAppSettings, getAdminStats } from "@/lib/actions/admin";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Loader from "@/components/loader";

type Stats = {
  totalUsers: number;
  dailyActiveUsers: number;
};

function QuickStat({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 border border-border/40 bg-card/50">
      <div className={`p-2 rounded-md ${color ?? "bg-primary/10 text-primary"}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="text-lg font-bold tracking-tight leading-none">{value}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function AdminGeneralPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appName, setAppName] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([getAppSettings(), getAdminStats()]).then(([s, st]) => {
      setAppName(s.appName);
      setStats(st);
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await updateAppSettings({ appName });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">General</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Overview and core application settings.
        </p>
      </div>

      {/* Quick stats */}
      {stats && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Quick Overview
            </p>
            <Link
              href="/admin/analytics"
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <BarChart3 className="h-3 w-3" />
              Full analytics
              <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <QuickStat
              label="Total Users"
              value={stats.totalUsers}
              icon={Users}
            />
            <QuickStat
              label="Active Today"
              value={stats.dailyActiveUsers}
              icon={Activity}
              color="bg-green-500/10 text-green-600 dark:text-green-400"
            />
          </div>
        </div>
      )}

      <Separator className="opacity-30" />

      {/* App settings */}
      <div className="max-w-xl">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-xs font-semibold">App Settings</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appName" className="text-xs">
              App Name
            </Label>
            <Input
              id="appName"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="My App"
            />
            <p className="text-[10px] text-muted-foreground">
              Used in emails, notifications, and the browser tab.
            </p>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      <Separator className="opacity-30" />

      {/* Quick links */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-3">
          Quick Links
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { href: "/admin", label: "Manage Users", icon: Users, desc: "Roles, bans, and user details" },
            { href: "/admin/notifications", label: "Notifications", icon: Bell, desc: "Send messages to users" },
            { href: "/admin/analytics", label: "Analytics", icon: BarChart3, desc: "Charts, growth, and metrics" },
            { href: "/admin/features", label: "Features", icon: ShieldCheck, desc: "Toggle app features" },
            { href: "/admin/api-keys", label: "API Keys", icon: Settings2, desc: "Service credentials" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-start gap-3 p-3 border border-border/40 hover:bg-muted/30 transition-colors group"
            >
              <item.icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium group-hover:text-foreground transition-colors">
                  {item.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
