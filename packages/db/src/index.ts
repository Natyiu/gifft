import { env } from "@Batman/env/server";
import { PrismaPg } from "@prisma/adapter-pg";

import { Prisma, PrismaClient } from "../prisma/generated/client";

function resolveConnectionString(): string {
  // The runtime client must use the POOLED (transaction-mode) connection.
  // The direct/session connection (DIRECT_URL, Supabase port 5432) is
  // reserved for migrations — using it at runtime exhausts Supabase's
  // session-mode pool (max 15 clients), which fails `next build` prerender
  // with EMAXCONNSESSION.
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.DIRECT_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ];

  for (const value of candidates) {
    const url = value?.trim();
    if (!url) continue;
    if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
      return url;
    }
  }

  throw new Error(
    "No valid Postgres connection string found. Set DIRECT_URL, POSTGRES_URL_NON_POOLING, DATABASE_URL, or POSTGRES_URL to a postgres:// URL.",
  );
}

const adapter = new PrismaPg({
  connectionString: resolveConnectionString(),
  // Cap connections per instance so concurrent prerender/serverless
  // invocations can't exhaust the pooler's client limit.
  max: 5,
});
const prisma = new PrismaClient({ adapter });

export default prisma;
export { Prisma };
