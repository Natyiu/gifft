"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

const techStack = [
  { label: "Next.js", desc: "Full-stack React" },
  { label: "Prisma", desc: "Type-safe ORM" },
  { label: "Better Auth", desc: "Authentication" },
  { label: "shadcn/ui", desc: "Components" },
  { label: "Tailwind", desc: "Styling" },
  { label: "TypeScript", desc: "Type safety" },
  { label: "PostgreSQL", desc: "Database" },
  { label: "Turborepo", desc: "Monorepo" },
];

const builtInFeatures = [
  { title: "Admin Dashboard", desc: "One place to control everything. Users, analytics, products, blog, notifications, feedback. Your startup's command center.", icon: "⚡" },
  { title: "Auth", desc: "Sign up, login, OAuth. Production-grade. Scales to millions. No auth headaches.", icon: "🔐" },
  { title: "Payments", desc: "Polar subscriptions wired. Create products, checkout, webhooks. Monetize from day one.", icon: "💳" },
  { title: "User Dashboard", desc: "Settings, organizations, invitations. Pro tier ready. Built for SaaS.", icon: "👤" },
  { title: "File Storage", desc: "Supabase storage. Uploads, avatars. S3-compatible. Production-ready.", icon: "📁" },
  { title: "Blog & CMS", desc: "Rich text, authors, SEO. Ship content without building a CMS.", icon: "✍️" },
  { title: "Notifications", desc: "In-app notifications, tags. Keep users engaged. Out of the box.", icon: "🔔" },
  { title: "Setup Wizard", desc: "Guided setup. Database, auth, storage, OAuth, payments. Non-technical founders can get live.", icon: "🧙" },
];

const outOfTheBox = [
  { title: "Auth", detail: "Sign up, login, password reset. Google and GitHub OAuth. Sessions and email verification included." },
  { title: "Admin dashboard", detail: "Users, analytics, blog CMS, notifications( send message to users), pricing, receive feedback, manage API keys. One control panel for everything." },
  { title: "Payments", detail: "Polar subscriptions wired. Create products, checkout flow, webhooks. Connect your account and start accepting payments." },
  { title: "User dashboard", detail: "Settings, organizations, invitations, notifications. Pro tier structure ready." },
  { title: "Storage & blog", detail: "Supabase storage for any upload feature for your app and avatars. Rich text blog with authors and SEO." },
  { title: "Setup Wizard", detail: "Out of the box setup Guide to help you get started: database, auth, features (storage, email, OAuth, payments). Generates .env for you — no manual config." },
];

const nightQuotes = [
  "The night is darkest just before the deploy.",
  "It's not who you are underneath, it's what you ship that defines you.",
  "Founders ship. Batman gives you the codebase.",
];

const setupSteps = [
  {
    number: "01",
    title: "Pay and get access",
    detail: "One-time purchase. You get instant access to the private repo.",
  },
  {
    number: "02",
    title: "Clone the project",
    command: "git clone <repo-url> && cd Batman",
  },
  {
    number: "03",
    title: "Install and run",
    command: "pnpm install && pnpm dev",
    detail: "Visit localhost:3001 — the Setup Wizard appears automatically.",
  },
  {
    number: "04",
    title: "Complete the onboarding",
    detail: "Guided setup: Database, Auth, Features (storage, email, OAuth, payments). The wizard generates your config. Run db:push, then you're live.",
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
  open,
  onToggle,
  children,
}: {
  label: string;
  title: string;
  number: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(
    open ? undefined : 0
  );
  const prevOpen = useRef(open);

  useEffect(() => {
    if (prevOpen.current === open) return;
    prevOpen.current = open;
    if (!contentRef.current) return;
    if (open) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(contentRef.current.scrollHeight);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setHeight(0));
      });
    }
  }, [open]);

  const onTransitionEnd = useCallback(() => {
    if (open) setHeight(undefined);
  }, [open]);

  return (
    <div className="border-b border-border/50">
      <button
        onClick={onToggle}
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

export default function MarketingPage() {
  const scrollRef = useScrollReveal();
  const [openSection, setOpenSection] = useState<string | null>("01");
  const searchParams = useSearchParams();
  const checkoutError = searchParams.get("error");

  return (
    <div ref={scrollRef} className="min-h-screen flex flex-col">
      {checkoutError && (
        <div className="fixed top-14 left-0 right-0 z-40 bg-destructive/10 border-b border-destructive/30 px-4 py-2.5 text-center">
          <p className="text-xs text-destructive">
            Checkout failed: {checkoutError.includes("Product not found") || checkoutError.includes("Product does not exist")
              ? "Product not found. Verify POLAR_MARKETING_PRODUCT_ID and POLAR_MARKETING_ACCESS_TOKEN (sandbox vs production)."
              : checkoutError.slice(0, 150)}
          </p>
        </div>
      )}
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-2">
              <BatLogo className="h-4 sm:h-5 w-auto text-foreground" />
              <div className="flex flex-col leading-none">
                <span className="font-semibold text-xs sm:text-sm tracking-widest uppercase">Batman</span>
                <span className="hidden sm:block text-[9px] tracking-[0.25em] uppercase text-muted-foreground">Production boilerplate for founders</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ThemeToggle />
              <a href="#features">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground hover:bg-secondary h-8 px-2 sm:px-3">
                  Features
                </Button>
              </a>
              <a href="#pricing">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground hover:bg-secondary h-8 px-2 sm:px-3">
                  Pricing
                </Button>
              </a>
              <Link href="/blog">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground hover:bg-secondary h-8 px-2 sm:px-3">
                  Blog
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
                  For Founders Who Ship
                </span>
                <div className="h-px flex-1 bg-border/30" />
                <span className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
                  Production codebase. One admin. Ship in hours.
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
                For founders
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-[1.15] mb-3 sm:mb-4">
              Ship your startup<br />
              <span className="text-muted-foreground/50">in hours, not months.</span>
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mb-4 sm:mb-5">
      A startup boilerplate with everything built in: auth, payments, admin dashboard, user management. All-in-one control panel. Scale to millions of users.
            </p>

            {/* Mini tech list */}
            <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 mb-4 sm:mb-5">
              {techStack.slice(0, 4).map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-foreground/40 shrink-0" />
                  <span className="text-[10px] sm:text-xs font-mono text-foreground/70">{f.label}</span>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground/40">{f.desc}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <a href="/api/checkout/marketing">
                <Button className="h-9 w-full sm:w-auto px-5 text-sm bg-foreground text-background hover:bg-foreground/90">
                  Get Batman — $49.99
                </Button>
              </a>
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
              {techStack.map((f) => (
                <div key={`${dup}-${f.label}`} className="flex items-center gap-2 shrink-0">
                  <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">{f.label}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">{f.desc}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Out of the box */}
      <section id="why" className="border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-6 sm:w-8 bg-foreground" />
            <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
              Out of the box
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight mb-6">
            Everything included.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {outOfTheBox.map((item, i) => (
              <div
                key={i}
                className="pl-4 border-l-2 border-foreground/20 py-1"
              >
                <p className="text-xs sm:text-sm font-medium text-foreground mb-1">{item.title}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px w-6 sm:w-8 bg-foreground" />
            <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
              Pricing
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight mb-1">
                One-time purchase
              </h2>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Pay once. Get lifetime access to the codebase.
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight">$49.99</span>
            </div>
          </div>
          <a href="/api/checkout/marketing" className="mt-6 inline-block">
            <Button className="h-10 px-6 text-sm font-medium bg-foreground text-background hover:bg-foreground/90">
              Get Batman — $49.99
            </Button>
          </a>
        </div>
      </section>

      {/* What's included */}
      <section id="features" className="border-t border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex items-center gap-2 mb-8 sm:mb-10">
            <div className="h-px w-6 sm:w-8 bg-foreground" />
            <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
              What&apos;s included
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-6 sm:mb-8">
            Everything your startup needs. Crafted out of the box.
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {builtInFeatures.map((f, i) => (
              <div
                key={i}
                className="border border-border/40 rounded-lg p-4 sm:p-5 hover:border-border/70 transition-colors"
              >
                <span className="text-base sm:text-lg mb-2 block">{f.icon}</span>
                <p className="text-sm font-medium text-foreground mb-1.5">{f.title}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expandable Sections */}
      <div id="setup" className="mt-[6vh] border-t border-border/50">
        <ExpandableSection number="01" label="Vibe Coding" title="Describe your product. Your AI builds it." open={openSection === "01"} onToggle={() => setOpenSection(openSection === "01" ? null : "01")}>
          <div className="max-w-2xl">
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6 sm:mb-8">
              You don&apos;t need to be technical. Open Cursor or Claude, describe what you want — the AI writes the code. Batman gives you a solid, production-grade foundation. Not a random vibe-coded prototype. A codebase that scales. Auth, admin, payments — all wired. Your AI knows where everything goes. Describe your feature. Ship your startup.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-sm font-medium">For founders</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Technical or non-technical. Describe your product. The architecture is there. Your AI builds on a real foundation.
                </p>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-sm font-medium">Production code</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Solid codebase. Scales to millions. Not a hacky prototype. Everything crafted for real startups.
                </p>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <p className="text-sm font-medium">Ship in hours</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Guided Setup Wizard. One admin dashboard. Describe your feature. Your startup is live.
                </p>
              </div>
            </div>
          </div>
        </ExpandableSection>

        <ExpandableSection number="02" label="Setup" title="Guided Setup Wizard. No manual config." open={openSection === "02"} onToggle={() => setOpenSection(openSection === "02" ? null : "02")}>
          <div className="grid md:grid-cols-[1fr,1.5fr] gap-10 md:gap-16 items-start">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5 sm:mb-6">
                Pay once, get access. Clone, install, run dev — the Setup Wizard appears in your browser. Walk through Database, Auth, Features (storage, email, OAuth, payments) and generate your config. Non-technical founders can get live without touching a config file.
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Wizard steps</p>
                <p className="text-[10px] sm:text-xs">Database → Auth → Features → Storage (optional) → Email (optional) → Social Login (optional) → Payments (optional) → Review & Launch</p>
              </div>
            </div>
            <div className="space-y-0">
              {setupSteps.map((step, i) => (
                <div key={step.number} className="group">
                  <div className="flex items-start gap-3 sm:gap-5 py-4 sm:py-6 border-b border-border/30">
                    <span className="font-mono text-xs text-muted-foreground/40 mt-1 shrink-0 w-5">
                      {step.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium mb-2">{step.title}</p>
                      {step.command && (
                        <div className="font-mono text-[10px] sm:text-xs bg-secondary/30 border border-border/30 rounded-md px-2.5 sm:px-3 py-2 sm:py-2.5 text-muted-foreground overflow-x-auto whitespace-nowrap">
                          <span className="text-foreground/60 select-none">$ </span>
                          {step.command}
                        </div>
                      )}
                      {step.detail && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground/60 mt-2">{step.detail}</p>
                      )}
                    </div>
                  </div>
                  {i === setupSteps.length - 1 && (
                    <div className="flex items-start gap-3 sm:gap-5 py-4 sm:py-6">
                      <span className="font-mono text-xs text-foreground mt-1 shrink-0 w-5">--</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">Your startup is live</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          Open <span className="font-mono text-foreground/80">localhost:3001</span> — production codebase, one admin dashboard. Hand it off to Cursor, Claude, or Codex and build your product.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ExpandableSection>
      </div>

      {/* CTA */}
      <section className="py-12 sm:py-16 border-t border-border/50">
        <div data-reveal className="max-w-6xl mx-auto px-4 sm:px-6 text-center reveal-section">
          <BatLogo className="h-6 sm:h-8 w-auto text-foreground mx-auto mb-4 sm:mb-6 opacity-60" />
          <p className="text-xs sm:text-sm text-muted-foreground/60 italic mb-4 sm:mb-6 max-w-md mx-auto">
            &ldquo;{nightQuotes[1]}&rdquo;
          </p>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight mb-3">
            For founders who want to ship.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 max-w-lg mx-auto">
            Production-grade codebase. One admin dashboard. Everything crafted out of the box. Technical or non-technical — ship your startup in hours. Get Batman.
          </p>
          <a href="/api/checkout/marketing">
            <Button className="h-11 px-8 text-sm font-medium bg-foreground text-background hover:bg-foreground/90">
              Get Batman — $49.99
            </Button>
          </a>
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
