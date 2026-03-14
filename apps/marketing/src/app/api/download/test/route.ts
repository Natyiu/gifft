import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { Readable } from "node:stream";
import archiver from "archiver";

/** Dev-only: bypasses purchase. Set ENABLE_TEST_DOWNLOAD=true to allow in production. */
const ALLOW_TEST_DOWNLOAD =
  process.env.NODE_ENV === "development" || process.env.ENABLE_TEST_DOWNLOAD === "true";

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
  "___vc", // Distribution platform folder — breaks pnpm workspace
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

function isMarketingPath(archivePath: string): boolean {
  const normalized = archivePath.replace(/\\/g, "/");
  for (const p of MARKETING_PATHS) {
    if (normalized === p || normalized.startsWith(p + "/")) return true;
  }
  return false;
}

function getCodebaseRoot(): string {
  const cwd = process.cwd();
  if (cwd.endsWith("apps/web") || cwd.includes("apps/web")) {
    return path.resolve(cwd, "..", "..");
  }
  if (cwd.endsWith("apps/marketing") || cwd.includes("apps/marketing")) {
    return path.resolve(cwd, "..", "..");
  }
  return cwd;
}

function shouldExclude(name: string): boolean {
  if (EXCLUDE_DIRS.has(name)) return true;
  if (EXCLUDE_FILES.has(name)) return true;
  if (name.startsWith(".env")) return true;
  return false;
}

export async function GET() {
  if (!ALLOW_TEST_DOWNLOAD) {
    return NextResponse.json({ error: "Test download disabled" }, { status: 403 });
  }

  const root = getCodebaseRoot();
  const packagesDir = path.join(root, "packages");
  const appsDir = path.join(root, "apps");

  if (!fs.existsSync(packagesDir) || !fs.existsSync(appsDir)) {
    console.error("[Download test] Codebase root not found:", root);
    return NextResponse.json({ error: "Codebase not available" }, { status: 500 });
  }

  const archive = archiver("zip", { zlib: { level: 6 } });

  function addDir(dirPath: string, archivePath: string) {
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
        addDir(fullPath, relPath);
      } else {
        archive.file(fullPath, { name: relPath });
      }
    }
  }

  addDir(root, "Batman");
  archive.finalize();

  const webStream = Readable.toWeb(archive) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="Batman.zip"',
    },
  });
}
