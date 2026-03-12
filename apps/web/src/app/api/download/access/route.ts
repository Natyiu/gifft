import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs";
import { Readable } from "node:stream";
import archiver from "archiver";
import prisma from "@Batman/db";

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
]);
const EXCLUDE_FILES = new Set([".env", ".env.local"]);

function getCodebaseRoot(): string {
  const cwd = process.cwd();
  if (cwd.endsWith("apps/web") || cwd.includes("apps/web")) {
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

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token || token.length !== 64) {
    return NextResponse.json({ error: "Invalid or missing token" }, { status: 400 });
  }

  const purchase = await prisma.marketingPurchase.findUnique({
    where: { downloadToken: token },
  });

  if (!purchase) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 404 });
  }

  if (purchase.expiresAt < new Date()) {
    return NextResponse.json({ error: "Download link has expired" }, { status: 410 });
  }

  const root = getCodebaseRoot();
  const packagesDir = path.join(root, "packages");
  const appsDir = path.join(root, "apps");

  if (!fs.existsSync(packagesDir) || !fs.existsSync(appsDir)) {
    console.error("[Download] Codebase root not found:", root);
    return NextResponse.json({ error: "Codebase not available" }, { status: 500 });
  }

  const archive = archiver("zip", { zlib: { level: 6 } });

  function addDir(dirPath: string, archivePath: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (shouldExclude(entry.name)) continue;
      const fullPath = path.join(dirPath, entry.name);
      const relPath = path.join(archivePath, entry.name);
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
