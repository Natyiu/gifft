"use server";

import { auth } from "@Batman/auth";
import prisma from "@Batman/db";
import { headers } from "next/headers";

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

  const [totalUsers, activeUsers, bannedUsers] = await Promise.all([
    prisma.user.count(),
    prisma.session.groupBy({
      by: ["userId"],
      _count: true,
    }),
    prisma.user.count({ where: { banned: true } }),
  ]);

  return {
    totalUsers,
    activeSessions: activeUsers.length,
    bannedUsers,
  };
}
