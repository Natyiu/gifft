#!/usr/bin/env node
/**
 * Builds Batman.zip for distribution (Vibecoded, etc.).
 * Run from repo root: pnpm run build:download
 *
 * Output: Batman.zip with package.json, pnpm-workspace.yaml, apps/web, packages/*
 * (no marketing app, no ___vc)
 */
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import archiver from "archiver";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, ".."); // repo root (scripts/ is at root)

const EXCLUDE_DIRS = new Set([
  "node_modules",
  ".git",
  ".turbo",
  ".next",
  "dist",
  "build",
  "coverage",
  ".nyc_output",
  ".cursor",
  ".alchemy",
  "___vc",
  "scripts", // build script — not needed for customers
]);
const EXCLUDE_FILES = new Set([".env", ".env.local"]);

const MARKETING_PATHS = new Set([
  "Batman/apps/web/src/app/marketing-page.tsx",
  "Batman/apps/web/src/app/marketing-page.stub.tsx",
  "Batman/apps/web/src/app/api/checkout",
  "Batman/apps/web/src/app/api/webhooks/polar-marketing",
  "Batman/apps/web/src/app/api/download",
  "Batman/apps/web/src/lib/actions/marketing.ts",
  "Batman/packages/db/prisma/schema/marketing.prisma",
  "Batman/apps/marketing",
]);

const MARKETING_PAGE_STUB = `"use client";
/** Stub — marketing excluded from customer download. */
export default function MarketingPage() {
  return null;
}
`;

function isMarketingPath(archivePath) {
  const normalized = archivePath.replace(/\\/g, "/");
  for (const p of MARKETING_PATHS) {
    if (normalized === p || normalized.startsWith(p + "/")) return true;
  }
  return false;
}

function shouldExclude(name) {
  if (EXCLUDE_DIRS.has(name)) return true;
  if (EXCLUDE_FILES.has(name)) return true;
  if (name.startsWith(".env")) return true;
  return false;
}

function addDir(archive, dirPath, archivePath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (shouldExclude(entry.name)) continue;
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.join(archivePath, entry.name).replace(/\\/g, "/");
    if (isMarketingPath(relPath)) {
      if (relPath.endsWith("marketing-page.tsx")) {
        archive.append(MARKETING_PAGE_STUB, { name: relPath });
      }
      continue;
    }
    if (entry.isDirectory()) {
      addDir(archive, fullPath, relPath);
    } else {
      archive.file(fullPath, { name: relPath });
    }
  }
}

const outPath = path.join(ROOT, "Batman.zip");
const out = fs.createWriteStream(outPath);
const archive = archiver("zip", { zlib: { level: 6 } });

archive.pipe(out);
addDir(archive, ROOT, "Batman");
await archive.finalize();

await new Promise((resolve, reject) => {
  out.on("close", resolve);
  out.on("error", reject);
});

console.log("Created", outPath);
console.log("Contents: Batman/package.json, Batman/pnpm-workspace.yaml, Batman/apps/web, Batman/packages/*");
