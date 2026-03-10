"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Users,
  Activity,
  UserPlus,
  CheckCircle,
  Building2,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { getAnalytics } from "@/lib/actions/admin";
import Loader from "@/components/loader";
import { WorldMap } from "@/components/world-map";

type Analytics = Awaited<ReturnType<typeof getAnalytics>>;

const MONO = {
  solid: "var(--foreground)",
  medium: "color-mix(in oklch, var(--foreground) 55%, transparent)",
  light: "color-mix(in oklch, var(--foreground) 30%, transparent)",
  faint: "color-mix(in oklch, var(--foreground) 15%, transparent)",
};

const PIE_SHADES = [
  "var(--foreground)",
  "color-mix(in oklch, var(--foreground) 65%, transparent)",
  "color-mix(in oklch, var(--foreground) 40%, transparent)",
  "color-mix(in oklch, var(--foreground) 25%, transparent)",
  "color-mix(in oklch, var(--foreground) 12%, transparent)",
];

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "flat";
}) {
  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-foreground"
      : trend === "down"
        ? "text-muted-foreground/60"
        : "text-muted-foreground/30";

  return (
    <div className="border border-border/40 bg-card/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {label}
        </p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground/40" />
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {trend && <TrendIcon className={`h-3.5 w-3.5 mb-1 ${trendColor}`} />}
      </div>
      {sub && (
        <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>
      )}
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border/40 bg-card/50">
      <div className="px-5 py-3 border-b border-border/30">
        <h3 className="text-xs font-semibold">{title}</h3>
        {description && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border shadow-lg px-3 py-2">
      <p className="text-[10px] font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-[10px] text-muted-foreground capitalize">
            {p.name}:
          </span>
          <span className="text-[10px] font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <Loader />;

  const { overview, dailyData, authProviders, countries, organizations } = data;

  const signupTrend: "up" | "down" | "flat" =
    overview.usersLast7d > overview.usersLast30d / 4
      ? "up"
      : overview.usersLast7d < overview.usersLast30d / 4
        ? "down"
        : "flat";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Analytics</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          The metrics that matter — last 30 days.
        </p>
      </div>

      {/* Core stat cards — the 6 questions a founder needs answered */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          label="Total Users"
          value={overview.totalUsers}
          sub={`+${overview.usersLast30d} in 30d · +${overview.usersLast7d} this week`}
          icon={Users}
          trend={signupTrend}
        />
        <StatCard
          label="Active Today"
          value={overview.dailyActiveUsers}
          sub={`${overview.weeklyActiveUsers} active this week`}
          icon={Activity}
          trend={
            overview.dailyActiveUsers > 0
              ? "up"
              : overview.totalUsers > 0
                ? "down"
                : "flat"
          }
        />
        <StatCard
          label="Onboarding Rate"
          value={`${overview.onboardingRate}%`}
          sub={`${overview.onboardedUsers} of ${overview.totalUsers} completed`}
          icon={CheckCircle}
          trend={
            overview.onboardingRate >= 70
              ? "up"
              : overview.onboardingRate >= 40
                ? "flat"
                : "down"
          }
        />
        <StatCard
          label="Notification Read Rate"
          value={`${overview.notificationReadRate}%`}
          sub="Are your messages landing?"
          icon={Bell}
          trend={
            overview.notificationReadRate >= 60
              ? "up"
              : overview.notificationReadRate >= 30
                ? "flat"
                : "down"
          }
        />
        <StatCard
          label="Organizations"
          value={organizations.totalOrgs}
          sub={`${organizations.avgMembersPerOrg} avg members per org`}
          icon={Building2}
        />
        <StatCard
          label="New This Week"
          value={`+${overview.usersLast7d}`}
          sub={`${overview.usersLast30d} in the last 30 days`}
          icon={UserPlus}
          trend={signupTrend}
        />
      </div>

      {/* Growth chart — signups + active users over time */}
      <ChartCard
        title="Growth & Engagement"
        description="Daily signups and unique active users over 30 days"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity={0.06} />
                  <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-border"
                opacity={0.3}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: "currentColor" }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                interval={Math.floor(dailyData.length / 7)}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "currentColor" }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="signups"
                stroke={MONO.solid}
                fill="url(#signupGrad)"
                strokeWidth={1.5}
                name="Signups"
              />
              <Area
                type="monotone"
                dataKey="activeUsers"
                stroke={MONO.medium}
                fill="url(#activeGrad)"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                name="Active Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-5 mt-3 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-px bg-foreground" />
            <span className="text-[10px] text-muted-foreground">Signups</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-px bg-foreground/55 border-t border-dashed border-foreground/55" />
            <span className="text-[10px] text-muted-foreground">
              Active Users
            </span>
          </div>
        </div>
      </ChartCard>

      {/* World map — where are your users */}
      <ChartCard
        title="Where Your Users Are"
        description="Geographic distribution based on session IP addresses (last 30 days)"
      >
        <WorldMap countries={countries} />
      </ChartCard>

      {/* Auth providers — where are users coming from */}
      <ChartCard
        title="Signup Methods"
        description="Which auth providers your users choose"
      >
        {authProviders.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No account data yet
          </p>
        ) : (
          <div className="flex items-center gap-8">
            <div className="h-48 w-48 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={authProviders}
                    dataKey="count"
                    nameKey="provider"
                    cx="50%"
                    cy="50%"
                    outerRadius={72}
                    innerRadius={40}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {authProviders.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_SHADES[i % PIE_SHADES.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{
                      fontSize: 11,
                    }}
                    wrapperClassName="!bg-popover !border-border !rounded-none !shadow-lg"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5">
              {authProviders.map((p, i) => {
                const total = authProviders.reduce(
                  (sum, item) => sum + item.count,
                  0
                );
                const pct = total > 0 ? Math.round((p.count / total) * 100) : 0;
                return (
                  <div key={p.provider} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: PIE_SHADES[i % PIE_SHADES.length],
                      }}
                    />
                    <div>
                      <p className="text-xs font-medium">{p.provider}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {p.count} users · {pct}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ChartCard>
    </div>
  );
}
