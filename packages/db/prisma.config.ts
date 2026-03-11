import dotenv from "dotenv";
import path from "node:path";
import { defineConfig } from "prisma/config";

dotenv.config({
  path: "../../apps/web/.env",
});

export default defineConfig({
  schema: path.join("prisma", "schema"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  datasource: {
    // Use process.env so prisma generate works without .env (e.g. fresh clone)
    url: process.env.DIRECT_URL ?? "postgresql://localhost:5432/placeholder",
  },
});
