"use server";

import { auth } from "@Batman/auth";
import prisma from "@Batman/db";
import { headers } from "next/headers";
import geoip from "geoip-country";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== "admin") throw new Error("Forbidden");
  return session;
}

export async function toggleOnboarding(enabled: boolean) {
  await requireAdmin();

  const settings = await prisma.appSettings.upsert({
    where: { id: "default" },
    update: { onboardingEnabled: enabled },
    create: { id: "default", onboardingEnabled: enabled },
  });

  return settings;
}

export async function updateAppSettings(data: {
  onboardingEnabled?: boolean;
  appName?: string;
  emailVerificationEnabled?: boolean;
  socialLoginEnabled?: boolean;
  organizationsEnabled?: boolean;
  invitesEnabled?: boolean;
}) {
  await requireAdmin();

  const settings = await prisma.appSettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });

  return settings;
}

export async function getApiKeys() {
  await requireAdmin();

  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
    select: {
      supabaseUrl: true,
      supabaseAnonKey: true,
      supabaseServiceRoleKey: true,
      resendApiKey: true,
      resendFromEmail: true,
      googleClientId: true,
      googleClientSecret: true,
      githubClientId: true,
      githubClientSecret: true,
    },
  });

  if (!settings) {
    return {
      supabaseUrl: "",
      supabaseAnonKey: "",
      supabaseServiceRoleKey: "",
      resendApiKey: "",
      resendFromEmail: "noreply@updates.yourdomain.com",
      googleClientId: "",
      googleClientSecret: "",
      githubClientId: "",
      githubClientSecret: "",
    };
  }

  return {
    supabaseUrl: settings.supabaseUrl ?? "",
    supabaseAnonKey: mask(settings.supabaseAnonKey),
    supabaseServiceRoleKey: mask(settings.supabaseServiceRoleKey),
    resendApiKey: mask(settings.resendApiKey),
    resendFromEmail: settings.resendFromEmail ?? "noreply@updates.yourdomain.com",
    googleClientId: settings.googleClientId ?? "",
    googleClientSecret: mask(settings.googleClientSecret),
    githubClientId: settings.githubClientId ?? "",
    githubClientSecret: mask(settings.githubClientSecret),
  };
}

export async function saveApiKeys(data: {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  resendApiKey?: string;
  resendFromEmail?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  githubClientId?: string;
  githubClientSecret?: string;
}) {
  await requireAdmin();

  const current = await prisma.appSettings.findUnique({
    where: { id: "default" },
    select: {
      supabaseAnonKey: true,
      supabaseServiceRoleKey: true,
      resendApiKey: true,
      googleClientSecret: true,
      githubClientSecret: true,
    },
  });

  const update: Record<string, string | null> = {};

  if (data.supabaseUrl !== undefined) {
    update.supabaseUrl = data.supabaseUrl || null;
  }
  if (data.supabaseAnonKey !== undefined) {
    update.supabaseAnonKey = unmasked(data.supabaseAnonKey)
      ? data.supabaseAnonKey || null
      : current?.supabaseAnonKey ?? null;
  }
  if (data.supabaseServiceRoleKey !== undefined) {
    update.supabaseServiceRoleKey = unmasked(data.supabaseServiceRoleKey)
      ? data.supabaseServiceRoleKey || null
      : current?.supabaseServiceRoleKey ?? null;
  }
  if (data.resendApiKey !== undefined) {
    update.resendApiKey = unmasked(data.resendApiKey)
      ? data.resendApiKey || null
      : current?.resendApiKey ?? null;
  }
  if (data.resendFromEmail !== undefined) {
    update.resendFromEmail = data.resendFromEmail || null;
  }
  if (data.googleClientId !== undefined) {
    update.googleClientId = data.googleClientId || null;
  }
  if (data.googleClientSecret !== undefined) {
    update.googleClientSecret = unmasked(data.googleClientSecret)
      ? data.googleClientSecret || null
      : current?.googleClientSecret ?? null;
  }
  if (data.githubClientId !== undefined) {
    update.githubClientId = data.githubClientId || null;
  }
  if (data.githubClientSecret !== undefined) {
    update.githubClientSecret = unmasked(data.githubClientSecret)
      ? data.githubClientSecret || null
      : current?.githubClientSecret ?? null;
  }

  await prisma.appSettings.upsert({
    where: { id: "default" },
    update,
    create: { id: "default", ...update },
  });

  return { success: true };
}

function mask(value: string | null | undefined): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 4) + "••••" + value.slice(-4);
}

function unmasked(value: string | undefined): boolean {
  if (!value) return true;
  return !value.includes("••••");
}

export async function getAdminStats() {
  await requireAdmin();

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [totalUsers, dailyActiveUsers] = await Promise.all([
    prisma.user.count(),
    prisma.session
      .groupBy({
        by: ["userId"],
        where: { createdAt: { gte: oneDayAgo } },
      })
      .then((r) => r.length),
  ]);

  return {
    totalUsers,
    dailyActiveUsers,
  };
}

export async function getAnalytics() {
  await requireAdmin();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    onboardedUsers,
    usersLast7d,
    usersLast30d,
    recentSignups,
    recentSessions,
    dailyActiveUsers,
    weeklyActiveUsers,
    accounts,
    totalOrgs,
    totalMembers,
    unreadRecipients,
    totalRecipients,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { onboardingCompleted: true } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.findMany({
      select: { createdAt: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.session.findMany({
      select: { createdAt: true, userId: true, ipAddress: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.session.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: oneDayAgo } },
    }).then((r) => r.length),
    prisma.session.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: sevenDaysAgo } },
    }).then((r) => r.length),
    prisma.account.groupBy({ by: ["providerId"], _count: true }),
    prisma.organization.count(),
    prisma.member.count(),
    prisma.notificationRecipient.count({ where: { read: false } }),
    prisma.notificationRecipient.count(),
  ]);

  // Build daily chart: signups + unique active users per day
  const dayMap: Record<string, { signups: number; activeUsers: Set<string> }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = { signups: 0, activeUsers: new Set() };
  }
  for (const u of recentSignups) {
    const key = new Date(u.createdAt).toISOString().slice(0, 10);
    if (dayMap[key]) dayMap[key].signups++;
  }
  for (const s of recentSessions) {
    const key = new Date(s.createdAt).toISOString().slice(0, 10);
    if (dayMap[key]) dayMap[key].activeUsers.add(s.userId);
  }
  const dailyData = Object.entries(dayMap).map(([date, data]) => ({
    date,
    label: new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    signups: data.signups,
    activeUsers: data.activeUsers.size,
  }));

  const authProviders = accounts.map((a) => ({
    provider:
      a.providerId === "credential"
        ? "Email/Password"
        : a.providerId.charAt(0).toUpperCase() + a.providerId.slice(1),
    count: a._count,
  }));

  // Resolve unique user IPs to countries
  const userIpMap = new Map<string, string>();
  for (const s of recentSessions) {
    if (s.ipAddress && !userIpMap.has(s.userId)) {
      userIpMap.set(s.userId, s.ipAddress);
    }
  }
  const countryCounts = new Map<string, { code: string; name: string; count: number }>();
  for (const ip of userIpMap.values()) {
    const result = geoip.lookup(ip);
    if (result) {
      const existing = countryCounts.get(result.country);
      if (existing) {
        existing.count++;
      } else {
        countryCounts.set(result.country, {
          code: result.country,
          name: result.name,
          count: 1,
        });
      }
    }
  }
  const countries = Array.from(countryCounts.values()).sort(
    (a, b) => b.count - a.count
  );

  const onboardingRate =
    totalUsers > 0 ? Math.round((onboardedUsers / totalUsers) * 100) : 0;
  const notificationReadRate =
    totalRecipients > 0
      ? Math.round(((totalRecipients - unreadRecipients) / totalRecipients) * 100)
      : 0;

  return {
    overview: {
      totalUsers,
      usersLast7d,
      usersLast30d,
      dailyActiveUsers,
      weeklyActiveUsers,
      onboardedUsers,
      onboardingRate,
      notificationReadRate,
    },
    dailyData,
    authProviders,
    countries,
    organizations: {
      totalOrgs,
      avgMembersPerOrg:
        totalOrgs > 0
          ? parseFloat((totalMembers / totalOrgs).toFixed(1))
          : 0,
    },
  };
}
