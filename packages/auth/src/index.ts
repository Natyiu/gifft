import prisma from "@Batman/db";
import { env } from "@Batman/env/server";
import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, organization } from "better-auth/plugins";
import { Resend } from "resend";

import { ac, admin, user } from "./permissions";

export { ac, admin, user } from "./permissions";

let _settingsCache: {
  data: Awaited<ReturnType<typeof prisma.appSettings.findUnique>>;
  ts: number;
} | null = null;

async function getSettings() {
  try {
    if (_settingsCache && Date.now() - _settingsCache.ts < 10_000) {
      return _settingsCache.data;
    }
    const data = await prisma.appSettings.findUnique({ where: { id: "default" } });
    _settingsCache = { data, ts: Date.now() };
    return data;
  } catch {
    return null;
  }
}

async function getResendClient(): Promise<Resend | null> {
  const settings = await getSettings();
  const apiKey = settings?.resendApiKey || env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const resend = await getResendClient();
    if (!resend) return;
    const settings = await getSettings();
    const from = settings?.resendFromEmail || "noreply@updates.yourdomain.com";
    await resend.emails.send({ from, to, subject, html });
  } catch {
    // Swallow — email failures shouldn't break auth
  }
}

async function notifyAllAdmins(data: {
  title: string;
  description: string;
  tag: string;
  senderId: string;
}) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true },
    });
    if (admins.length === 0) return;

    await prisma.notification.create({
      data: {
        ...data,
        recipients: {
          create: admins.map((a) => ({ userId: a.id })),
        },
      },
    });
  } catch {
    // Never break auth flow for notifications
  }
}

async function getGoogleCredentials() {
  const settings = await getSettings();
  const clientId = settings?.googleClientId || env.GOOGLE_CLIENT_ID;
  const clientSecret = settings?.googleClientSecret || env.GOOGLE_CLIENT_SECRET;
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

const googleCreds = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
  ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
  : { clientId: "placeholder", clientSecret: "placeholder" };

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.CORS_ORIGIN],

  emailAndPassword: {
    enabled: true,
    async sendResetPassword({ user, url }) {
      const settings = await getSettings();
      const appName = settings?.appName ?? "Batman";
      await sendEmail(
        user.email,
        `Reset your ${appName} password`,
        `<p>Hi ${user.name ?? "there"},</p><p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p><p>If you didn't request this, ignore this email.</p>`,
      );
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    async sendVerificationEmail({ user, url }) {
      const settings = await getSettings();
      if (!settings?.emailVerificationEnabled) return;
      const appName = settings.appName ?? "Batman";
      await sendEmail(
        user.email,
        `Verify your ${appName} email`,
        `<p>Hi ${user.name ?? "there"},</p><p>Click the link below to verify your email:</p><p><a href="${url}">${url}</a></p>`,
      );
    },
  },

  socialProviders: {
    google: googleCreds,
  },

  user: {
    additionalFields: {
      bio: { type: "string", required: false, input: true },
      onboardingCompleted: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: true,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (newUser) => {
          const count = await prisma.user.count();
          const isFirstUser = count === 1;

          if (isFirstUser) {
            await prisma.user.update({
              where: { id: newUser.id },
              data: { role: "admin" },
            });
            try {
              await prisma.notification.create({
                data: {
                  title: "You're the admin",
                  description: "As the first user, you have full admin access. You can manage users, settings, and everything from the admin dashboard.",
                  tag: "general",
                  senderId: "system",
                  recipients: {
                    create: [{ userId: newUser.id }],
                  },
                },
              });
            } catch {
              // Never break auth flow for notifications
            }
          } else {
            try {
              await prisma.notification.create({
                data: {
                  title: "Welcome",
                  description: "You've created your account. Get started by exploring the dashboard.",
                  tag: "general",
                  senderId: "system",
                  recipients: {
                    create: [{ userId: newUser.id }],
                  },
                },
              });
            } catch {
              // Never break auth flow for notifications
            }
          }
        },
      },
    },
  },

  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const session =
        ctx.context.newSession ??
        ((ctx.context as Record<string, unknown>).session as
          | { user: { id: string; name?: string; email?: string } }
          | undefined);

      if (ctx.path === "/change-password" && session?.user) {
        try {
          await prisma.notification.create({
            data: {
              title: "Password changed",
              description: "Your password was updated successfully.",
              tag: "security",
              senderId: "system",
              recipients: {
                create: [{ userId: session.user.id }],
              },
            },
          });
        } catch {
          // Never break auth flow for notifications
        }
      }
      // delete-user: user is gone, no notification needed
    }),
  },

  plugins: [
    nextCookies(),
    adminPlugin({
      ac,
      roles: { admin, user },
    }),
    organization({
      async sendInvitationEmail({ email, organization: org, inviter }) {
        const settings = await getSettings();
        if (!settings?.invitesEnabled) return;
        const appName = settings.appName ?? "Batman";
        const acceptUrl = `${env.BETTER_AUTH_URL}/dashboard/invitations`;
        await sendEmail(
          email,
          `You're invited to ${org.name} on ${appName}`,
          `<p>${inviter.user.name ?? "Someone"} invited you to join <strong>${org.name}</strong> on ${appName}.</p><p><a href="${acceptUrl}">Accept Invitation</a></p>`,
        );
      },
    }),
  ],
});

export { getGoogleCredentials, getResendClient };
