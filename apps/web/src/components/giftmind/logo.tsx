import Link from "next/link";

import { cn } from "@/lib/utils";

export function GiftMindMark({ className }: { className?: string }) {
  // Playful rounded gift mark in brand blue.
  return (
    <svg viewBox="0 0 40 40" className={cn("text-primary", className)} fill="none" aria-hidden>
      <rect x="3" y="16" width="34" height="21" rx="6" fill="currentColor" opacity="0.18" />
      <rect x="3" y="16" width="34" height="21" rx="6" stroke="currentColor" strokeWidth="3" />
      <rect x="16" y="16" width="8" height="21" rx="2.5" fill="currentColor" />
      <path
        d="M20 16c0-4-3.2-7-6.4-7C10.8 9 9 10.7 9 13c0 1.9 1.6 3 3.4 3H20Zm0 0c0-4 3.2-7 6.4-7C29.2 9 31 10.7 31 13c0 1.9-1.6 3-3.4 3H20Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GiftMindWordmark({
  href = "/",
  className,
  markClassName,
}: {
  href?: string;
  className?: string;
  markClassName?: string;
}) {
  return (
    <Link href={href as never} className={cn("inline-flex items-center gap-2", className)}>
      <GiftMindMark className={cn("h-7 w-7", markClassName)} />
      <span className="font-logo text-xl font-bold tracking-tight text-primary">Gifft</span>
    </Link>
  );
}
