import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isMarketing = process.env.NEXT_PUBLIC_MARKETING === "true";

const BLOCKED_PATHS = [
  "/login",
  "/signup",
  "/reset-password",
  "/forgot-password",
  "/dashboard",
  "/admin",
  "/pricing",
  "/subscribe",
  "/onboarding",
];

function isBlockedPath(pathname: string): boolean {
  return BLOCKED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export function middleware(request: NextRequest) {
  if (!isMarketing) return NextResponse.next();

  if (isBlockedPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}
