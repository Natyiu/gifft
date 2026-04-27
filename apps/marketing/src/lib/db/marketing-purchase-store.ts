import { randomUUID } from "node:crypto";
import pg, { type Pool as PgPool } from "pg";

const { Pool } = pg;

type MarketingPurchaseRecord = {
  email: string;
  polarOrderId: string;
  downloadToken: string;
  expiresAt: Date;
};

type MarketingPurchaseLookup = {
  id: string;
  email: string;
  polarOrderId: string;
  downloadToken: string;
  expiresAt: Date;
  createdAt: Date;
};

let pool: PgPool | null = null;

function resolveConnectionString(): string {
  const candidates = [
    process.env.DIRECT_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
  ];

  for (const value of candidates) {
    const url = value?.trim();
    if (!url) continue;
    if (url.startsWith("postgres://") || url.startsWith("postgresql://")) return url;
  }

  throw new Error(
    "No valid Postgres connection string found. Set DIRECT_URL, POSTGRES_URL_NON_POOLING, DATABASE_URL, or POSTGRES_URL.",
  );
}

function getPool(): PgPool {
  if (pool) return pool;
  pool = new Pool({
    connectionString: resolveConnectionString(),
    max: 5,
    idleTimeoutMillis: 10_000,
  });
  return pool;
}

export async function createMarketingPurchase(record: MarketingPurchaseRecord): Promise<boolean> {
  const db = getPool();
  const id = randomUUID();
  const result = await db.query(
    `INSERT INTO marketing_purchase (id, email, polar_order_id, download_token, expires_at, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (polar_order_id) DO NOTHING`,
    [id, record.email, record.polarOrderId, record.downloadToken, record.expiresAt],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function findMarketingPurchaseByToken(
  downloadToken: string,
): Promise<MarketingPurchaseLookup | null> {
  const db = getPool();
  const result = await db.query(
    `SELECT id, email, polar_order_id, download_token, expires_at, created_at
     FROM marketing_purchase
     WHERE download_token = $1
     LIMIT 1`,
    [downloadToken],
  );

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id as string,
    email: row.email as string,
    polarOrderId: row.polar_order_id as string,
    downloadToken: row.download_token as string,
    expiresAt: new Date(row.expires_at as string | Date),
    createdAt: new Date(row.created_at as string | Date),
  };
}
