"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { TagSelect } from "@/components/giftmind/tag-select";
import {
  QUESTIONS,
  EMPTY_ANSWERS,
  buildDraft,
  ChoiceList,
  TextQuestion,
  type Answers,
} from "@/components/giftmind/quiz-flow";
import { saveDraft } from "@/lib/giftmind/draft";
import { cn } from "@/lib/utils";

/* ==========================================================================
 *  Cinematic ribbon onboarding
 *  --------------------------------------------------------------------------
 *  One continuous journey. The gift box + ribbon are the only persistent
 *  elements. Every "Next" is a *scene change*: the ribbon swells into a
 *  full-screen cloth sweep that folds the current page away and unfurls the
 *  next one, while the box slides/flips to a brand-new corner of the viewport
 *  with its own camera angle. The finale spirals the ribbon into a bow,
 *  opens the box, and the warm glow expands into the app.
 * ======================================================================== */

const TOTAL = QUESTIONS.length;
const GOLDEN = 2.399963229728653; // golden angle (rad) — spreads scenes evenly

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const deg = (r: number) => (r * 180) / Math.PI;

/* -------------------------------------------------------------------------- */
/*  Spring engine — a tiny critically-tunable integrator, no dependencies.    */
/* -------------------------------------------------------------------------- */

type Channel = { v: number; target: number; vel: number; stiffness: number; damping: number };
const mkChannel = (v: number, stiffness: number, damping: number): Channel => ({
  v,
  target: v,
  vel: 0,
  stiffness,
  damping,
});

/* -------------------------------------------------------------------------- */
/*  Scenes — each step gets a unique composition, derived procedurally so no  */
/*  two consecutive screens share a camera angle, box corner, or ribbon path. */
/* -------------------------------------------------------------------------- */

type Scene = {
  bx: number; // box centre, fraction of width
  by: number; // box centre, fraction of height (kept in the upper band)
  rx: number; // box pitch (deg)
  ry: number; // box yaw (deg)
  rz: number; // box roll (deg)
  flow: number; // direction the ribbon streams away from the box (rad)
  cardShift: number; // small horizontal drift of the card, for framing variety
};

function sceneFor(i: number, mobile = false): Scene {
  const a = i * GOLDEN;
  // Box travels the LOWER band of the viewport (the card lives up top). On
  // mobile it hugs the bottom in a narrower arc so it never runs off a small
  // screen or slides up behind the card.
  const bx = 0.5 + Math.cos(a) * (mobile ? 0.17 : 0.32);
  // Keep the box low enough that it always clears the question card above it
  // (the card sits in front, so any overlap reads as the box "stuck" behind it).
  const by = mobile ? 0.86 + Math.sin(a * 1.3) * 0.04 : 0.83 + Math.sin(a * 1.3) * 0.06;
  return {
    bx: clamp01(bx),
    by: clamp01(by),
    rx: Math.cos(a * 0.8) * (mobile ? 10 : 13),
    ry: Math.sin(a) * (mobile ? 18 : 26),
    rz: Math.sin(a * 1.7) * (mobile ? 8 : 11),
    flow: a + Math.PI * 0.62, // ribbon streams off at a rotated angle each time
    cardShift: mobile ? 0 : Math.cos(a * 0.9) * 26,
  };
}

/* -------------------------------------------------------------------------- */
/*  Ribbon geometry                                                            */
/* -------------------------------------------------------------------------- */

/** The living ribbon at rest — a short satin S-tail streaming off the box. */
function restingRibbon(cx: number, cy: number, angle: number, len: number, whip: number) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const px = -dy;
  const py = dx;
  const amp = len * 0.16 * (1 + whip * 0.14);
  const w = whip * 22;
  const p0x = cx + dx * len * 0.04;
  const p0y = cy + dy * len * 0.04;
  const c1x = cx + dx * len * 0.34 + px * (amp + w);
  const c1y = cy + dy * len * 0.34 + py * (amp + w);
  const c2x = cx + dx * len * 0.68 - px * (amp * 0.85 + w);
  const c2y = cy + dy * len * 0.68 - py * (amp * 0.85 + w);
  const p3x = cx + dx * len;
  const p3y = cy + dy * len;
  return `M ${p0x} ${p0y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p3x} ${p3y}`;
}

/**
 * The transition ribbon — a huge undulating cloth band that wipes across the
 * whole viewport, twisting as it passes. `t` runs 0→1; the band is centred at
 * t = 0.5, fattest at the midpoint, then thins as it unfurls into the new page.
 */
function sweepBand(W: number, H: number, t: number) {
  const diag = Math.hypot(W, H);
  const L = diag * 1.35;
  const swell = Math.sin(clamp01(t) * Math.PI); // 0 → 1 → 0
  const T = Math.min(W, H) * (0.3 + 0.62 * swell);
  const waves = 3;
  const amp = T * 0.3;
  const steps = 26;
  const phase = t * 6.5;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const x = -L + 2 * L * f;
    const y = -T / 2 + Math.sin(f * Math.PI * waves + phase) * amp;
    d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  for (let i = steps; i >= 0; i--) {
    const f = i / steps;
    const x = -L + 2 * L * f;
    const y = T / 2 + Math.sin(f * Math.PI * waves + phase + 0.7) * amp;
    d += ` L ${x} ${y}`;
  }
  return d + " Z";
}

/* -------------------------------------------------------------------------- */
/*  Gift box (SVG) — wrapped, unties, re-ties, opens.                          */
/* -------------------------------------------------------------------------- */

function GiftBox({ tie, open, glow }: { tie: number; open: number; glow: number }) {
  // The lid (top face + top straps + bow) floats straight up and tips back.
  const lift = open * 44;
  const lidTransform = `translate(0 ${-lift}) rotate(${-open * 10} 60 40)`;
  return (
    <svg viewBox="0 0 120 134" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="faceTop" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="var(--card)" />
          <stop offset="1" stopColor="var(--secondary)" />
        </linearGradient>
        <linearGradient id="strapV" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
        <radialGradient id="giftGlow" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="var(--primary)" stopOpacity="0.98" />
          <stop offset="0.5" stopColor="var(--accent)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>
        <filter id="giftShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="9" stdDeviation="8" floodColor="#000" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* contact shadow on the ground */}
      <ellipse cx="60" cy="124" rx="45" ry="9" fill="#000" opacity="0.16" />

      {/* ---- BODY: two visible side faces + front ribbon straps ---- */}
      <g filter="url(#giftShadow)">
        {/* left face (lighter) */}
        <polygon points="16,52 60,76 60,120 16,96" fill="var(--secondary)" stroke="var(--border)" strokeWidth="1" />
        {/* right face (shaded darker for depth) */}
        <polygon points="104,52 60,76 60,120 104,96" fill="var(--secondary)" stroke="var(--border)" strokeWidth="1" />
        <polygon points="104,52 60,76 60,120 104,96" fill="#000" opacity="0.14" />

        {/* vertical straps running down the front edge on both faces */}
        <polygon points="60,76 60,120 49.5,114 49.5,70" fill="var(--primary)" />
        <polygon points="60,76 60,120 70.5,114 70.5,70" fill="var(--primary)" />
        <polygon points="60,76 60,120 70.5,114 70.5,70" fill="#000" opacity="0.14" />
      </g>

      {/* interior opening — revealed as the lid rises */}
      {open > 0.01 && (
        <>
          <polygon points="60,28 104,52 60,76 16,52" fill="var(--background)" opacity={Math.min(1, open * 1.5)} />
          <ellipse cx="60" cy="52" rx={28 + open * 22} ry={17 + open * 13} fill="url(#giftGlow)" opacity={open} />
        </>
      )}

      {/* ---- LID: top face + crossing straps + bow, lifts up on open ---- */}
      <g transform={lidTransform}>
        <polygon points="60,28 104,52 60,76 16,52" fill="url(#faceTop)" stroke="var(--border)" strokeWidth="1" />
        {/* straps crossing the top face */}
        <polygon points="60,30 70,52 60,74 50,52" fill="url(#strapV)" />
        <polygon points="24,52 60,60 96,52 60,44" fill="var(--primary)" opacity="0.9" />

        {/* 3D-ish bow resting on the back of the lid */}
        <g opacity={tie} transform={`translate(60 30) scale(${0.7 + tie * 0.5}) rotate(${(1 - tie) * -20})`}>
          <path d="M0 4 C -22 -14, -33 10, -6 9 Z" fill="var(--primary)" />
          <path d="M0 4 C 22 -14, 33 10, 6 9 Z" fill="var(--primary)" />
          <path d="M0 4 C -22 -14, -33 10, -6 9" fill="none" stroke="#000" strokeOpacity="0.1" strokeWidth="1.4" />
          <path d="M-5 8 L -15 25" stroke="var(--primary)" strokeWidth="4.5" strokeLinecap="round" opacity={tie} />
          <path d="M5 8 L 15 25" stroke="var(--primary)" strokeWidth="4.5" strokeLinecap="round" opacity={tie} />
          <circle cx="0" cy="6" r="7" fill="var(--primary)" stroke="var(--card)" strokeWidth="1.6" />
        </g>
      </g>

      {glow > 0.01 && (
        <ellipse cx="60" cy="74" rx="58" ry="26" fill="none" stroke="var(--primary)" strokeWidth="1.5" opacity={glow * 0.4} />
      )}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main orchestrator                                                          */
/* -------------------------------------------------------------------------- */

type Phase = "intro" | "active" | "finale";

export function RibbonOnboarding() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ ...EMPTY_ANSWERS });
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [, force] = useState(0);
  const navigated = useRef(false);
  const reduce = useRef(false);
  const mobile = useRef(false);

  // Spring channels — box position/rotation glide between scenes; ribbon +
  // finale channels drive the wrapping choreography.
  const ch = useRef({
    bx: mkChannel(0.5, 60, 15),
    by: mkChannel(0.46, 60, 15),
    scale: mkChannel(1.28, 70, 16),
    rx: mkChannel(0, 55, 13),
    ry: mkChannel(0, 55, 13),
    rz: mkChannel(0, 55, 13),
    spin: mkChannel(0, 42, 8), // transient flip flourish, springs back to 0
    drawn: mkChannel(0, 70, 16), // resting-ribbon length
    whip: mkChannel(0, 120, 8), // cloth wobble impulse
    tie: mkChannel(1, 110, 16),
    open: mkChannel(0, 55, 14),
    glow: mkChannel(0, 40, 12),
  });

  // Transition timeline (the ribbon sweep). Runs alongside the springs.
  const tl = useRef({ active: false, t: 0, dur: 0.95, swapped: false, to: 0, dir: 1, flow: 0 });

  const raf = useRef(0);
  const running = useRef(false);
  const last = useRef(0);

  // Apply a scene's composition to the box springs.
  const applyScene = useCallback((s: Scene, sc: number) => {
    const c = ch.current;
    c.bx.target = s.bx;
    c.by.target = s.by;
    c.scale.target = sc;
    c.rx.target = s.rx;
    c.ry.target = s.ry;
    c.rz.target = s.rz;
  }, []);

  const ensureLoop = useCallback(() => {
    if (running.current) return;
    running.current = true;
    last.current = 0;
    const frame = (now: number) => {
      const dt = last.current ? Math.min(0.032, (now - last.current) / 1000) : 0.016;
      last.current = now;
      const c = ch.current;
      let active = false;

      // advance the transition timeline
      const t = tl.current;
      if (t.active) {
        if (reduce.current) {
          t.t = 1;
        } else {
          t.t += dt / t.dur;
        }
        if (!t.swapped && t.t >= 0.46) {
          t.swapped = true;
          setIndex(t.to);
          applyScene(sceneFor(t.to, mobile.current), mobile.current ? 0.92 : 1.05);
          c.drawn.target = 1;
          c.whip.vel += t.dir * 5;
        }
        if (t.t >= 1) {
          t.t = 1;
          t.active = false;
        } else {
          active = true;
        }
      }

      // integrate springs
      for (const key in c) {
        const s = c[key as keyof typeof c];
        if (reduce.current) {
          s.v = s.target;
          s.vel = 0;
          continue;
        }
        const a = -s.stiffness * (s.v - s.target) - s.damping * s.vel;
        s.vel += a * dt;
        s.v += s.vel * dt;
        if (Math.abs(s.v - s.target) > 0.0004 || Math.abs(s.vel) > 0.0004) active = true;
      }

      force((x) => (x + 1) % 1_000_000);
      if (active && !reduce.current) {
        raf.current = requestAnimationFrame(frame);
      } else {
        running.current = false;
      }
    };
    raf.current = requestAnimationFrame(frame);
  }, [applyScene]);

  const setT = useCallback(
    (name: keyof typeof ch.current, target: number) => {
      ch.current[name].target = target;
      ensureLoop();
    },
    [ensureLoop],
  );
  const kick = useCallback(
    (name: keyof typeof ch.current, impulse: number) => {
      ch.current[name].vel += impulse;
      ensureLoop();
    },
    [ensureLoop],
  );

  // mount: dimensions + reduced-motion, paint an initial frame
  useEffect(() => {
    reduce.current =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const measure = () => {
      mobile.current = window.innerWidth < 640;
      setDims({ w: window.innerWidth, h: window.innerHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    ensureLoop();
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", measure);
    };
  }, [ensureLoop]);

  const q = QUESTIONS[index];
  const firstName = answers.name.trim().split(" ")[0] || "them";

  function set<K extends keyof Answers>(key: K, value: Answers[K]) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  const start = useCallback(() => {
    setPhase("active");
    applyScene(sceneFor(0, mobile.current), mobile.current ? 0.92 : 1.05);
    setT("drawn", 1);
    // Keep the bow tied — the box stays a wrapped gift through the whole flow.
    kick("whip", 6);
    kick("spin", 55);
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  }, [applyScene, kick, setT]);

  // Fire a scene change: swell the ribbon sweep, flip the box, land the next page.
  const runTransition = useCallback(
    (to: number, dir: number) => {
      const t = tl.current;
      if (t.active) return false;
      t.active = true;
      t.t = 0;
      t.swapped = false;
      t.to = to;
      t.dir = dir;
      t.dur = reduce.current ? 0.01 : 0.95;
      t.flow = sceneFor(to).flow;
      kick("whip", dir * 8);
      kick("spin", dir * 95);
      ensureLoop();
      return true;
    },
    [ensureLoop, kick],
  );

  const beginFinale = useCallback(() => {
    if (navigated.current) return;
    saveDraft(buildDraft(answers));
    setPhase("finale");
    // ribbon spirals in, box glides to centre & grows, bow re-ties, lid opens
    applyScene(
      { bx: 0.5, by: 0.42, rx: 0, ry: 0, rz: 0, flow: Math.PI * 0.5, cardShift: 0 },
      mobile.current ? 1.25 : 1.5,
    );
    setT("drawn", 0.55);
    kick("whip", 10);
    kick("spin", 180);
    // Re-wrap the box (bow re-ties, ribbon draws in), then go straight to the
    // reveal. We intentionally do NOT open the lid or fire the glow wash.
    const t1 = window.setTimeout(() => {
      setT("tie", 1);
      setT("drawn", 0);
    }, 900);
    const t2 = window.setTimeout(() => {
      navigated.current = true;
      router.push("/start/reveal" as never);
    }, 1900);
    void [t1, t2];
  }, [answers, applyScene, kick, router, setT]);

  const next = useCallback(() => {
    if (index === 0 && !answers.name.trim()) {
      toast.error("We just need their name to start.");
      return;
    }
    if (index >= TOTAL - 1) {
      beginFinale();
      return;
    }
    runTransition(index + 1, 1);
  }, [index, answers.name, beginFinale, runTransition]);

  const back = useCallback(() => {
    if (index === 0) return;
    runTransition(index - 1, -1);
  }, [index, runTransition]);

  /* ---- derive render values from the springs ---- */
  const { w: W, h: H } = dims;
  const c = ch.current;
  const scale = c.scale.v;
  const boxPx = W ? Math.max(120, Math.min(W, H) * 0.2) : 150;
  const size = boxPx * scale;
  const cx = c.bx.v * W;
  const cy = c.by.v * H;

  const tActive = tl.current.active;
  const tRaw = tl.current.t;
  const sweep = tActive ? Math.sin(clamp01(tRaw) * Math.PI) : 0;

  const drawn = clamp01(c.drawn.v);
  const whip = c.whip.v;
  // Long enough that the far end always runs off the screen edge (clipped by
  // the svg viewport) on any aspect ratio — the ribbon reads as continuing out.
  const restLen = W ? Math.hypot(W, H) * 1.2 : 0;
  const restPath = W ? restingRibbon(cx, cy, sceneFor(index, mobile.current).flow, restLen, whip) : "";
  const restVisible = phase !== "intro" && drawn > 0.01 && sweep < 0.9;

  const tie = c.tie.v;
  const open = c.open.v;
  const glow = c.glow.v;

  const boxTransform = `translate(-50%, -50%) perspective(1000px) rotateX(${c.rx.v}deg) rotateY(${
    c.ry.v + c.spin.v
  }deg) rotateZ(${c.rz.v}deg)`;
  const boxBlur = Math.min(5, Math.abs(c.spin.vel) * 0.012);

  const showCard = phase === "active";
  const value = q ? answers[q.id] : null;
  const hasAnswer = !q
    ? false
    : q.kind === "multi"
      ? (value as string[]).length > 0
      : typeof value === "string"
        ? value.trim().length > 0
        : value != null;
  const canSkip = Boolean(q?.optional);
  const nameMissing = index === 0 && !answers.name.trim();
  // Required questions must be answered before advancing; optional ones may be skipped.
  const blockNext = !hasAnswer && !canSkip;
  const isLast = index === TOTAL - 1;

  // Card folds away as the ribbon swells, then the keyed content unfurls back.
  const cardFold = sweep;
  const cardStyle: React.CSSProperties = {
    transform: `perspective(1200px) translateX(${sceneFor(index, mobile.current).cardShift}px) rotateX(${
      cardFold * 46
    }deg) scale(${1 - cardFold * 0.16})`,
    opacity: 1 - cardFold * 1.25,
    transformOrigin: "center top",
    filter: sweep > 0.02 ? `blur(${sweep * 4}px)` : undefined,
  };

  // Sweep-band placement: rides across the viewport, perpendicular to its axis.
  const sweepDeg = deg(tl.current.flow) + Math.sin(tRaw * Math.PI) * 26;
  const perp = W ? (tRaw - 0.5) * Math.hypot(W, H) * 2.2 : 0;
  const sweepBlur = 6 + 12 * sweep;

  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-background">
      {/* soft depth backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 18%, color-mix(in oklab, var(--primary) 12%, transparent), transparent 70%)",
        }}
      />

      {/* ---- Resting ribbon (the living cloth tail off the box) ---- */}
      {W > 0 && restVisible && (
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="ribbon-sway pointer-events-none fixed inset-0 z-10"
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          aria-hidden
        >
          <defs>
            <linearGradient id="ribbonSatin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="var(--primary)" />
              <stop offset="0.5" stopColor="var(--accent)" />
              <stop offset="1" stopColor="var(--primary)" />
            </linearGradient>
            <filter id="ribbonBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
          <path
            d={restPath}
            fill="none"
            stroke="#000"
            strokeOpacity={0.16}
            strokeWidth={26}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - drawn}
            transform="translate(0 9)"
            filter="url(#ribbonBlur)"
          />
          <path
            d={restPath}
            fill="none"
            stroke="url(#ribbonSatin)"
            strokeWidth={22}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - drawn}
          />
          <path
            d={restPath}
            fill="none"
            stroke="#fff"
            strokeOpacity={0.3}
            strokeWidth={5}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - drawn}
          />
        </svg>
      )}

      {/* ---- Gift box ---- */}
      {W > 0 && (
        <button
          type="button"
          onClick={phase === "intro" ? start : undefined}
          aria-label={phase === "intro" ? "Open your gift to begin" : "Gift"}
          className={cn(
            "fixed z-20 flex items-center justify-center outline-none",
            phase === "intro" ? "cursor-pointer" : "cursor-default",
          )}
          style={{
            left: cx,
            top: cy,
            width: size,
            height: size,
            transform: boxTransform,
            filter: boxBlur > 0.2 ? `blur(${boxBlur}px)` : undefined,
            willChange: "transform",
          }}
        >
          <span
            className={cn(
              "flex h-full w-full items-center justify-center",
              phase === "intro" && "animate-[giftbob_3.4s_ease-in-out_infinite]",
            )}
          >
            <GiftBox tie={tie} open={open} glow={glow} />
          </span>
        </button>
      )}

      {/* ---- Intro caption ---- */}
      {phase === "intro" && W > 0 && (
        <div
          className="fixed inset-x-0 z-20 flex flex-col items-center px-6 text-center animate-in fade-in duration-700"
          style={{ top: cy + size * 0.55 + 24 }}
        >
          <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">A gift, unwrapped.</h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Tap the box to begin. We&apos;ll wrap the perfect gift together.
          </p>
          <span className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-lg">
            Tap to open ✨
          </span>
        </div>
      )}

      {/* ---- Question card (pinned to the top; the box lives in the lower band) ---- */}
      {showCard && q && (
        <div className="fixed inset-x-0 top-[5.5rem] z-30 flex justify-center px-4 sm:top-[7rem] sm:px-5">
          <div className="w-full max-w-md" style={cardStyle}>
            <div key={index} className="ribbon-unfurl">
              <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-2xl sm:p-6">
                <div className="mb-4 flex flex-col items-center text-center sm:mb-5">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 text-2xl shadow-sm ring-1 ring-primary/10 sm:mb-3 sm:h-16 sm:w-16 sm:text-3xl">
                    {q.emoji}
                  </div>
                  <h2 className="font-serif text-lg font-semibold leading-tight tracking-tight text-balance sm:text-2xl">
                    {q.prompt(firstName)}
                  </h2>
                  {q.sub && <p className="mt-1.5 text-sm text-muted-foreground">{q.sub}</p>}
                </div>

                <div className="max-h-[26vh] overflow-y-auto px-0.5 sm:max-h-[34vh]">
                  {q.kind === "text" && (
                    <TextQuestion
                      multiline={Boolean(q.multiline)}
                      placeholder={q.placeholder}
                      value={value as string}
                      onChange={(v) => set(q.id, v as Answers[typeof q.id])}
                      onEnter={!q.multiline ? next : undefined}
                    />
                  )}
                  {q.kind === "multi" && (
                    <TagSelect
                      options={q.options}
                      values={value as string[]}
                      onChange={(v) => set(q.id, v as Answers[typeof q.id])}
                    />
                  )}
                  {q.kind === "single" && (
                    <ChoiceList
                      options={q.options}
                      value={value as string | null}
                      onPick={(v) => set(q.id, v as Answers[typeof q.id])}
                    />
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={back}
                    disabled={index === 0}
                    className={cn(
                      "inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground",
                      index === 0 && "invisible",
                    )}
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </button>

                  <div className="flex items-center gap-3">
                    {canSkip && !hasAnswer && !nameMissing && (
                      <button
                        type="button"
                        onClick={next}
                        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        Skip
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={next}
                      disabled={blockNext}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:brightness-105 active:scale-95",
                        blockNext && "cursor-not-allowed opacity-50",
                      )}
                    >
                      {isLast ? "Wrap it up" : "Next"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                Step {index + 1} of {TOTAL} · sign in at the end to reveal — answers are saved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ---- The transition ribbon: a full-screen cloth sweep that folds one
             page away and unfurls the next ---- */}
      {W > 0 && sweep > 0.005 && !reduce.current && (
        <svg
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="pointer-events-none fixed inset-0 z-40"
          aria-hidden
        >
          <defs>
            <linearGradient id="sweepSatin" x1="0" y1="0" x2="1" y2="0.4">
              <stop offset="0" stopColor="var(--primary)" />
              <stop offset="0.45" stopColor="var(--accent)" />
              <stop offset="0.55" stopColor="#fff" stopOpacity="0.85" />
              <stop offset="0.65" stopColor="var(--accent)" />
              <stop offset="1" stopColor="var(--primary)" />
            </linearGradient>
          </defs>
          <g
            style={{ filter: `blur(${sweepBlur}px)` }}
            transform={`translate(${W / 2} ${H / 2}) rotate(${sweepDeg}) translate(0 ${perp})`}
          >
            <path d={sweepBand(W, H, tRaw)} fill="url(#sweepSatin)" opacity={0.97} />
            <path
              d={sweepBand(W, H, tRaw)}
              fill="none"
              stroke="#fff"
              strokeOpacity={0.28}
              strokeWidth={3}
            />
          </g>
        </svg>
      )}

      {/* ---- Finale caption ---- */}
      {phase === "finale" && W > 0 && (
        <div
          className="fixed inset-x-0 z-30 flex flex-col items-center px-6 text-center animate-in fade-in duration-500"
          style={{ top: cy + size * 0.55 + 24 }}
        >
          <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            {`Wrapping ${firstName}'s gift…`}
          </h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            {answers.name.trim() ? `${firstName}'s ideas are on their way.` : "Your ideas are on their way."}
          </p>
        </div>
      )}

      {/* warm light wash as the box opens — expands into the app */}
      {open > 0.02 && (
        <div
          className="pointer-events-none fixed inset-0 z-50 bg-[radial-gradient(circle_at_50%_42%,var(--primary),transparent_60%)]"
          style={{ opacity: Math.min(0.9, open * 0.95) }}
          aria-hidden
        />
      )}
    </div>
  );
}
