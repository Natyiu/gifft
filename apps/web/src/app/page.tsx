"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

function BatLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 40"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M50 0C50 0 42 14 30 18C18 22 0 18 0 18C0 18 12 28 20 32C28 36 50 40 50 40C50 40 72 36 80 32C88 28 100 18 100 18C100 18 82 22 70 18C58 14 50 0 50 0Z" />
    </svg>
  );
}

const features = [
  { label: "Next.js", desc: "Full-stack React" },
  { label: "Prisma", desc: "Type-safe ORM" },
  { label: "Better Auth", desc: "Authentication" },
  { label: "shadcn/ui", desc: "Components" },
  { label: "Tailwind", desc: "Styling" },
  { label: "TypeScript", desc: "Type safety" },
  { label: "PostgreSQL", desc: "Database" },
  { label: "Turborepo", desc: "Monorepo" },
];

const nightQuotes = [
  "The night is darkest just before the deploy.",
  "It's not who you are underneath, it's what you ship that defines you.",
  "Why do we fall? So we can learn to build again.",
];

const steps = [
  {
    number: "01",
    title: "Summon the repo",
    command: "git clone <repo-url> && cd Batman",
  },
  {
    number: "02",
    title: "Gear up",
    command: "pnpm install",
  },
  {
    number: "03",
    title: "Load your secrets",
    command: "cp .env.example apps/web/.env",
    detail: "Add your Supabase credentials",
  },
  {
    number: "04",
    title: "Forge the database",
    command: "pnpm run db:generate && pnpm run db:push",
  },
  {
    number: "05",
    title: "Into the night",
    command: "pnpm run dev",
  },
];

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const children = el.querySelectorAll<HTMLElement>("[data-reveal]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );

    requestAnimationFrame(() => {
      children.forEach((child) => {
        const rect = child.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          child.classList.add("revealed");
        } else {
          observer.observe(child);
        }
      });
    });

    return () => observer.disconnect();
  }, []);

  return ref;
}

function ExpandableSection({
  label,
  title,
  number,
  defaultOpen = false,
  children,
}: {
  label: string;
  title: string;
  number: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(
    defaultOpen ? undefined : 0
  );

  const toggle = useCallback(() => {
    if (!contentRef.current) return;
    if (open) {
      setHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setHeight(0));
      });
    } else {
      setHeight(contentRef.current.scrollHeight);
    }
    setOpen((prev) => !prev);
  }, [open]);

  const onTransitionEnd = useCallback(() => {
    if (open) setHeight(undefined);
  }, [open]);

  return (
    <div className="border-b border-border/50">
      <button
        onClick={toggle}
        className="w-full group cursor-pointer"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-4 sm:gap-6">
          <span className="font-mono text-xs sm:text-sm text-muted-foreground/30 shrink-0 w-6 sm:w-8 text-right">
            {number}
          </span>
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
              {label}
            </span>
            <div className="h-px flex-1 bg-border/30" />
            <span className="text-sm sm:text-base font-semibold tracking-tight text-foreground group-hover:text-foreground/80 transition-colors">
              {title}
            </span>
          </div>
          <div
            className={`shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-border/50 flex items-center justify-center transition-all duration-300 group-hover:border-foreground/30 ${open ? "bg-foreground" : "bg-transparent"}`}
          >
            <svg
              viewBox="0 0 12 12"
              className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-300 ${open ? "rotate-45 text-background" : "rotate-0 text-foreground"}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <line x1="6" y1="1" x2="6" y2="11" />
              <line x1="1" y1="6" x2="11" y2="6" />
            </svg>
          </div>
        </div>
      </button>
      <div
        ref={contentRef}
        style={{ height: height !== undefined ? `${height}px` : "auto" }}
        onTransitionEnd={onTransitionEnd}
        className={`overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${height === 0 ? "opacity-0" : "opacity-100"}`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 sm:pb-16">
          {children}
        </div>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="w-8 h-8 rounded-full border border-border/50 flex items-center justify-center hover:border-foreground/30 transition-colors cursor-pointer"
      aria-label="Toggle theme"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        className="w-3.5 h-3.5 text-foreground"
      >
        {isDark ? (
          <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        ) : (
          <path
            d="M13.5 8.5a5.5 5.5 0 0 1-6-6 5.5 5.5 0 1 0 6 6Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}

export default function LandingPage() {
  const scrollRef = useScrollReveal();

  return (
    <div ref={scrollRef} className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <BatLogo className="h-4 sm:h-5 w-auto text-foreground" />
              <div className="flex flex-col leading-none">
                <span className="font-semibold text-xs sm:text-sm tracking-widest uppercase">Batman</span>
                <span className="hidden sm:block text-[9px] tracking-[0.25em] uppercase text-muted-foreground">The Dark Knight</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ThemeToggle />
              <Link href="/about">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground hover:bg-secondary h-8 px-2 sm:px-3">
                  About
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground hover:bg-secondary h-8 px-2 sm:px-3">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="text-xs h-8 px-3 sm:px-4 bg-foreground text-background hover:bg-foreground/90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-14">
        {/* Hero header row */}
        <div className="border-b border-border/50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4 sm:gap-6 py-3 sm:py-4">
              <span className="font-mono text-xs sm:text-sm text-muted-foreground/30 shrink-0 w-6 sm:w-8 text-right">
                00
              </span>
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
                  A Vibe Coding Boilerplate
                </span>
                <div className="h-px flex-1 bg-border/30" />
                <span className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
                  Batman: The Dark Knight
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero body — full width, left: image / right: content */}
        <div className="md:flex border-b border-border/50 min-h-[50vh]">
          {/* Left — image placeholder */}
          <div className="relative hidden md:block md:w-1/2">
            <div className="relative h-full overflow-hidden">
              <Image
                src="/bat.jpeg"
                alt="Batman"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent" />
              <div className="absolute inset-0 bg-linear-to-r from-transparent to-background/40" />
              <div className="absolute bottom-4 left-5 right-5">
                <p className="text-xs font-mono text-foreground/60 italic">
                  &ldquo;{nightQuotes[0]}&rdquo;
                </p>
              </div>
            </div>
          </div>

          {/* Right — content */}
          <div className="py-6 sm:py-8 md:py-8 md:w-1/2 px-4 sm:px-6 md:px-0 md:pl-10 lg:pl-12 md:pr-5 lg:pr-8 flex flex-col justify-center md:border-l md:border-border/50">
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <div className="h-px w-6 sm:w-8 bg-foreground" />
              <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
                Ship before sunrise
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-[1.15] mb-3 sm:mb-4">
              Your best ideas<br />
              <span className="text-muted-foreground/50">hit at 3 AM.</span>
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mb-4 sm:mb-5">
              A production-ready Next.js boilerplate built for vibe coding. Auth, database, and UI — already wired. Clone it, open your AI IDE, and ship that 3 AM idea before sunrise.
            </p>

            {/* Mini feature list */}
            <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 mb-4 sm:mb-5">
              {features.slice(0, 4).map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-foreground/40 shrink-0" />
                  <span className="text-[10px] sm:text-xs font-mono text-foreground/70">{f.label}</span>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground/40">{f.desc}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Link href="/signup">
                <Button className="h-9 w-full sm:w-auto px-5 text-sm font-medium bg-foreground text-background hover:bg-foreground/90">
                  Enter the Batcave
                </Button>
              </Link>
              <Link href="#setup">
                <Button variant="ghost" className="h-9 w-full sm:w-auto px-5 text-sm text-muted-foreground hover:text-foreground">
                  View Setup
                </Button>
              </Link>
            </div>

            {/* Mobile quote */}
            <p className="mt-4 text-xs text-muted-foreground/40 italic md:hidden">
              &ldquo;{nightQuotes[0]}&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Tech Strip — Marquee */}
      <section className="border-y border-border/50 py-2.5 sm:py-3 overflow-hidden">
        <div className="relative flex">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-24 z-10 bg-linear-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-24 z-10 bg-linear-to-l from-background to-transparent" />
          {[0, 1].map((dup) => (
            <div
              key={dup}
              className="flex shrink-0 animate-marquee items-center gap-8 sm:gap-12 px-4 sm:px-6"
            >
              {features.map((f) => (
                <div key={`${dup}-${f.label}`} className="flex items-center gap-2 shrink-0">
                  <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">{f.label}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{f.desc}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Expandable Sections */}
      <div className=" mt-[10vh] border-t border-border/50">
        <ExpandableSection number="01" label="Vibe Coding" title="You talk. Your AI builds." defaultOpen>
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 sm:mb-8">
              Vibe coding is building software by describing what you want to an AI — and letting it write the code. No boilerplate wiring. No config files. Just intent and iteration. Batman gives you the perfect starting point: auth, database, UI, and a full-stack architecture that AI IDEs like Cursor, Claude Code, and Codex already understand.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-sm font-medium">Describe it</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Open Cursor or Claude Code. Tell it what you&apos;re building. The architecture is already there — your AI knows exactly where everything goes.
                </p>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-sm font-medium">Iterate fast</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Auth, database, API routes, UI components — all wired up. Your AI isn&apos;t wasting tokens on setup. It&apos;s building your actual product.
                </p>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-sm font-medium">Ship by morning</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  That 3 AM spark becomes a working app before your coffee. Batman is the boilerplate that turns midnight vibe sessions into real products.
                </p>
              </div>
            </div>
          </div>
        </ExpandableSection>

        <ExpandableSection number="02" label="Suit Up" title="Five commands. Before the sun rises.">
          <div className="grid md:grid-cols-[1fr,1.5fr] gap-10 md:gap-16 items-start">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5 sm:mb-6">
                It&apos;s 3 AM. The idea won&apos;t let you sleep. Five commands and you&apos;ve got a full-stack app running — then open your AI IDE and start vibe coding.
              </p>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-foreground font-mono text-[10px] sm:text-xs mt-0.5 shrink-0">DATABASE_URL</span>
                  <span className="text-[10px] sm:text-xs">Supabase Transaction URL <span className="text-muted-foreground/60">(port 6543)</span></span>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <span className="text-foreground font-mono text-[10px] sm:text-xs mt-0.5 shrink-0">DIRECT_URL</span>
                  <span className="text-[10px] sm:text-xs">Supabase Session URL <span className="text-muted-foreground/60">(port 5432)</span></span>
                </div>
              </div>
            </div>
            <div className="space-y-0">
              {steps.map((step, i) => (
                <div key={step.number} className="group">
                  <div className="flex items-start gap-3 sm:gap-5 py-4 sm:py-6 border-b border-border/30">
                    <span className="font-mono text-xs text-muted-foreground/40 mt-1 shrink-0 w-5">
                      {step.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-2">{step.title}</p>
                      <div className="font-mono text-[10px] sm:text-xs bg-secondary/30 border border-border/30 rounded-md px-2.5 sm:px-3 py-2 sm:py-2.5 text-muted-foreground overflow-x-auto whitespace-nowrap">
                        <span className="text-foreground/60 select-none">$ </span>
                        {step.command}
                      </div>
                      {step.detail && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground/60 mt-2">{step.detail}</p>
                      )}
                    </div>
                  </div>
                  {i === steps.length - 1 && (
                    <div className="flex items-start gap-3 sm:gap-5 py-4 sm:py-6">
                      <span className="font-mono text-xs text-foreground mt-1 shrink-0 w-5">
                        --
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Gotham is yours</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Open{" "}
                          <span className="font-mono text-foreground/80">localhost:3001</span>
                          {" "}— your app is live before dawn. Hand it off to{" "}
                          <span className="text-foreground">Cursor</span>,{" "}
                          <span className="text-foreground">Claude Code</span>,{" "}
                          <span className="text-foreground">Antigravity</span>,{" "}
                          or{" "}
                          <span className="text-foreground">Codex</span>{" "}
                          and vibe code until sunrise.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ExpandableSection>

        <ExpandableSection number="03" label="Config" title="The Bat-Signal Config">
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">Every vigilante needs their secrets. Here&apos;s what goes in <span className="font-mono text-foreground/80">apps/web/.env</span></p>
            <div className="font-mono text-[10px] sm:text-xs bg-secondary/30 border border-border/30 rounded-lg p-3 sm:p-5 leading-relaxed overflow-x-auto">
              <div className="text-muted-foreground/40 mb-3"># Authentication</div>
              <div><span className="text-foreground">BETTER_AUTH_SECRET</span><span className="text-muted-foreground">=</span><span className="text-muted-foreground/60">your-secret-here</span></div>
              <div><span className="text-foreground">BETTER_AUTH_URL</span><span className="text-muted-foreground">=</span><span className="text-foreground">http://localhost:3001</span></div>
              <div><span className="text-foreground">CORS_ORIGIN</span><span className="text-muted-foreground">=</span><span className="text-foreground">http://localhost:3001</span></div>
              <div className="mt-3 text-muted-foreground/40"># Supabase</div>
              <div><span className="text-foreground">DATABASE_URL</span><span className="text-muted-foreground">=</span><span className="text-muted-foreground/60">postgresql://...@...pooler.supabase.com:6543/postgres?pgbouncer=true</span></div>
              <div><span className="text-foreground">DIRECT_URL</span><span className="text-muted-foreground">=</span><span className="text-muted-foreground/60">postgresql://...@...supabase.com:5432/postgres</span></div>
            </div>
          </div>
        </ExpandableSection>
      </div>

      {/* CTA */}
      <section className="py-12 sm:py-16">
        <div data-reveal className="max-w-6xl mx-auto px-4 sm:px-6 text-center reveal-section">
          <BatLogo className="h-6 sm:h-8 w-auto text-foreground mx-auto mb-4 sm:mb-6 opacity-60" />
          <p className="text-xs sm:text-sm text-muted-foreground/60 italic mb-4 sm:mb-6 max-w-md mx-auto">
            &ldquo;{nightQuotes[1]}&rdquo;
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-3">
            Can&apos;t sleep? Start vibe coding.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto">
            That 3 AM idea won&apos;t build itself. Clone Batman, open your AI IDE, and let the vibes carry you from midnight spark to shipped product.
          </p>
          <Link href="/signup">
            <Button className="h-10 w-full sm:w-auto px-8 text-sm font-medium bg-foreground text-background hover:bg-foreground/90">
              Answer the Signal
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      {/* <footer className="border-t border-border/50 py-5 sm:py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <BatLogo className="h-3 sm:h-3.5 w-auto text-foreground opacity-60" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-muted-foreground">Batman</span>
                <span className="text-[8px] sm:text-[9px] tracking-[0.2em] uppercase text-muted-foreground/40">The Dark Knight</span>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground/60 text-center">
              &copy; {new Date().getFullYear()} Batman. The vibe coding boilerplate for builders who don&apos;t sleep.
            </p>
          </div>
        </div>
      </footer> */}
    </div>
  );
}
