import path from "node:path";
import { config } from "dotenv";

// Load .env: try apps/web/.env when running from monorepo root, else .env in cwd
const cwd = process.cwd();
const webEnvPath = path.resolve(cwd, "apps/web/.env");
const localEnvPath = path.resolve(cwd, ".env");
config({ path: webEnvPath });
config({ path: localEnvPath }); // overrides when running from apps/web (same file)

import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    CORS_ORIGIN: z.url(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    // All keys below are optional fallbacks — prefer configuring via Admin > Settings > API Keys
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
