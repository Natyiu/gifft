"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const HOLD_MS = 620;

/**
 * A press-and-hold gift box that fills up as you hold it, then pops and fires
 * `onComplete`. This is GiftMind's playful "continue" — holding for ~0.6s fills
 * the box; releasing early springs it back. Enter/Space (when focused) completes
 * instantly for keyboard users.
 */
export function HoldToContinue({
  onComplete,
  label = "Hold to continue",
  hint = "press & hold",
  disabled = false,
  className,
}: {
  onComplete: () => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}) {
  const clipId = useId().replace(/:/g, "");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const raf = useRef<number | null>(null);
  const startTs = useRef<number | null>(null);
  const holding = useRef(false);

  const stop = useCallback(() => {
    holding.current = false;
    startTs.current = null;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
  }, []);

  const finish = useCallback(() => {
    stop();
    setProgress(1);
    setDone(true);
    window.setTimeout(() => onComplete(), 240);
  }, [onComplete, stop]);

  const tick = useCallback(
    (now: number) => {
      if (!holding.current) return;
      if (startTs.current == null) startTs.current = now;
      const p = Math.min(1, (now - startTs.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) finish();
      else raf.current = requestAnimationFrame(tick);
    },
    [finish],
  );

  const begin = useCallback(() => {
    if (disabled || done) return;
    holding.current = true;
    startTs.current = null;
    raf.current = requestAnimationFrame(tick);
  }, [disabled, done, tick]);

  const release = useCallback(() => {
    if (done) return;
    stop();
    setProgress(0);
  }, [done, stop]);

  useEffect(() => () => stop(), [stop]);

  // Fill height for the clip rect (rises from the bottom).
  const fillY = 100 - progress * 100;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <button
        type="button"
        disabled={disabled}
        onPointerDown={(e) => {
          e.preventDefault();
          begin();
        }}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            finish();
          }
        }}
        aria-label={label}
        className={cn(
          "group relative flex h-24 w-24 touch-none select-none items-center justify-center rounded-3xl outline-none transition-transform",
          done ? "scale-110" : "hover:scale-[1.03] active:scale-95",
          "focus-visible:ring-4 focus-visible:ring-primary/30",
          disabled && "cursor-not-allowed opacity-40",
        )}
      >
        {/* soft glow that grows with progress */}
        <span
          aria-hidden
          className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl transition-opacity"
          style={{ opacity: 0.15 + progress * 0.6 }}
        />
        <svg viewBox="0 0 100 100" className="relative h-20 w-20 overflow-visible">
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y={fillY} width="100" height={progress * 100} />
            </clipPath>
          </defs>
          {/* base (empty) gift */}
          <GiftShape fill="var(--muted)" stroke="var(--border)" />
          {/* filled gift, revealed from the bottom up */}
          <g clipPath={`url(#${clipId})`}>
            <GiftShape fill="var(--primary)" stroke="var(--primary)" />
          </g>
          {/* sparkle pop on completion */}
          {done && (
            <g className="animate-in fade-in zoom-in duration-300">
              <path d="M50 4 L53 16 L50 22 L47 16 Z" fill="var(--primary)" />
              <path d="M92 34 L84 40 L78 40 L86 34 Z" fill="var(--primary)" />
              <path d="M10 40 L18 40 L24 34 L14 34 Z" fill="var(--primary)" />
            </g>
          )}
        </svg>
      </button>
      <span className="text-sm font-medium text-foreground">{done ? "Nice!" : label}</span>
      {!done && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

function GiftShape({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <g stroke={stroke} strokeWidth="2.5" strokeLinejoin="round">
      {/* box body */}
      <rect x="20" y="46" width="60" height="40" rx="4" fill={fill} />
      {/* lid */}
      <rect x="14" y="34" width="72" height="16" rx="4" fill={fill} />
      {/* vertical ribbon */}
      <rect x="45" y="34" width="10" height="52" fill={stroke} stroke="none" opacity="0.55" />
      {/* bow */}
      <path
        d="M50 34 C 44 20, 30 20, 32 30 C 33 36, 44 35, 50 34 Z"
        fill={fill}
      />
      <path
        d="M50 34 C 56 20, 70 20, 68 30 C 67 36, 56 35, 50 34 Z"
        fill={fill}
      />
      <circle cx="50" cy="33" r="4" fill={stroke} stroke="none" />
    </g>
  );
}
