"use server";

import { auth } from "@Batman/auth";
import prisma from "@Batman/db";
import { headers } from "next/headers";
import { notifyAdmins } from "@/lib/notify";

export async function updateProfile(data: {
  name?: string;
  bio?: string;
  image?: string;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  const changes: string[] = [];
  if (data.name) changes.push("name");
  if (data.bio) changes.push("bio");
  if (data.image) changes.push("avatar");

  if (changes.length > 0) {
    await notifyAdmins({
      title: "Profile updated",
      description: `${session.user.name ?? session.user.email} updated their ${changes.join(", ")}.`,
      tag: "update",
      senderId: session.user.id,
    });
  }

  return { success: true };
}

export async function completeOnboarding() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingCompleted: true },
  });

  await notifyAdmins({
    title: "Onboarding completed",
    description: `${session.user.name ?? session.user.email} completed the onboarding flow.`,
    tag: "general",
    senderId: session.user.id,
  });

  return { success: true };
}

export async function getAppSettings() {
  let settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });

  if (!settings) {
    settings = await prisma.appSettings.create({
      data: { id: "default" },
    });
  }

  return settings;
}

export async function getStorageUrl(): Promise<string> {
  const settings = await getAppSettings();
  return settings.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export async function getAuthConfig() {
  const settings = await getAppSettings();
  const hasGoogle = !!(
    (settings.googleClientId && settings.googleClientSecret) ||
    (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  );
  const hasGithub = !!(
    (settings.githubClientId && settings.githubClientSecret) ||
    (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
  );

  return {
    socialLoginEnabled: settings.socialLoginEnabled,
    googleEnabled: settings.socialLoginEnabled && hasGoogle,
    githubEnabled: settings.socialLoginEnabled && hasGithub,
    organizationsEnabled: settings.organizationsEnabled,
    invitesEnabled: settings.invitesEnabled,
  };
}
