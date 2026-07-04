import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Archive,
  Sparkles,
  Users,
  BellRing,
  HandCoins,
  Link2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GiftMindMark, GiftMindWordmark } from "@/components/giftmind/logo";

export const dynamic = "force-dynamic";

const FAILURE_MODES = [
  {
    title: "The blank wall",
    body: "You sit down to think of a gift and your mind goes empty. You love this person — but under a deadline, nothing comes. So you Google “gifts for men who like coffee” and buy something forgettable.",
  },
  {
    title: "The repeat",
    body: "You found something they loved last year. This year you can't remember what it was, and you almost buy something too similar — or someone in the family already did.",
  },
  {
    title: "The mismatch",
    body: "You spent $80 on something you were sure was perfect. They smiled politely. You both knew it missed. Wasted money plus quiet disappointment.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Describe the person",
    body: "Not a form — more like describing them to a friend. Their personality, what they're into lately, what they'd never buy themselves, what landed before.",
  },
  {
    n: "02",
    title: "GiftMind thinks about them",
    body: "Pick the occasion, your budget, and the tone. GiftMind takes a moment to actually consider who they are — then generates ideas built around it.",
  },
  {
    n: "03",
    title: "Get gifts, not a listicle",
    body: "Specific products with the reason each one suits this exact person, a cheaper and a premium alternative, and a way to make it personal.",
  },
];

const FEATURES = [
  { icon: Brain, title: "Hyper-specific ideas", body: "Never “a nice candle.” Always the specific thing, with the reason it fits this exact person." },
  { icon: Archive, title: "Gift Vault", body: "Every gift ever given or received, logged per person. Two years in, it's a record you can't replace." },
  { icon: BellRing, title: "Never miss it", body: "“Maya's birthday is in 14 days — last year you got her the cookbook. Here are 5 new ideas.”" },
  { icon: Sparkles, title: "“They'd never buy this”", body: "Surfaces the indulgent things they'd secretly love but would never justify buying themselves." },
  { icon: Users, title: "Family coordination", body: "Share a profile so everyone sees what's claimed. Mom's 70th becomes a board, not a group-text mess." },
  { icon: HandCoins, title: "Group gifting", body: "For the big ones — everyone chips in on a private page, one person orders. The coordination is handled." },
];

const TESTIMONIALS = [
  {
    quote:
      "I got my dad a gift he actually talked about for a month. The reasoning line was so spot-on it felt like cheating.",
    name: "Priya",
    role: "Personal plan",
  },
  {
    quote:
      "The 'they'd never buy this themselves' toggle is dangerous. In the best way. My sister cried.",
    name: "Marcus",
    role: "Family plan",
  },
  {
    quote:
      "Found it at 11pm the night before a birthday. Did one search, bought idea #3, looked like a hero.",
    name: "Dani",
    role: "One-time search",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <GiftMindWordmark />
          <nav className="flex items-center gap-2">
            <Link href={"/pricing" as never}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Pricing
              </Button>
            </Link>
            <Link href={"/login" as never}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Log in
              </Button>
            </Link>
            <Link href={"/start" as never}>
              <Button size="sm" className="rounded-full">
                Try it free
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-32 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="mx-auto max-w-3xl px-5 pb-16 pt-20 text-center md:pt-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Thoughtful gifts, generated for who they actually are
          </div>
          <h1 className="font-serif text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            The perfect gift for{" "}
            <span className="text-primary">anyone</span> in your life.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Describe a person — their personality, their world, what they love — and GiftMind generates
            genuinely thoughtful, specific gift ideas, each with the reason it fits <em>them</em>. Not a
            listicle. Gifts from someone who really thought about it.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={"/start" as never}>
              <Button size="lg" className="h-12 rounded-full px-7 text-base">
                Find a gift now <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
            <Link href={"/pricing" as never}>
              <Button size="lg" variant="outline" className="h-12 rounded-full px-7 text-base">
                See pricing
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Free to try · 2 searches a month, no card needed
          </p>
        </div>
      </section>

      {/* The problem */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-serif text-2xl font-semibold tracking-tight md:text-3xl">
            Gift-giving fails in three ways. You know all of them.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {FAILURE_MODES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-serif text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-8 max-w-xl text-center text-base text-foreground">
          GiftMind solves all three.
        </p>
      </section>

      {/* How it works */}
      <section className="border-y border-border/50 bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="mb-10 text-center font-serif text-2xl font-semibold tracking-tight md:text-3xl">
            How it works
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
                <span className="font-serif text-3xl font-semibold text-primary/30">{s.n}</span>
                <h3 className="mt-2 font-serif text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sample result */}
      <section className="mx-auto max-w-3xl px-5 py-16">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          What a result looks like
        </p>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-md">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">~$42</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Object</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Sentimental</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
              <Sparkles className="h-3 w-3" /> They&apos;d never buy this
            </span>
          </div>
          <h3 className="mt-3 font-serif text-xl font-semibold">
            A hand-poured cedar-and-woodsmoke candle from a small-batch maker
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            You mentioned she got into sourdough last year and loves a slow Sunday — this is the kind of
            warm, lived-in object she&apos;d never stumble on herself.
          </p>
          <div className="mt-4 grid gap-2 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Cheaper:</span> a single travel-size candle from the same maker</p>
            <p><span className="font-medium text-foreground">Premium:</span> a three-scent gift set with a brass lid</p>
            <p><span className="font-medium text-foreground">Make it personal:</span> light it once before wrapping so it arrives already &ldquo;lived in.&rdquo;</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="mb-10 text-center font-serif text-2xl font-semibold tracking-tight md:text-3xl">
          More than a generator
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-serif text-base font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border/50 bg-secondary/40">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="mb-10 text-center font-serif text-2xl font-semibold tracking-tight md:text-3xl">
            People who looked like they tried
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <blockquote className="text-sm leading-relaxed text-foreground">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{t.name}</span> · {t.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-5 py-20 text-center">
        <Link2 className="mx-auto mb-4 h-6 w-6 text-accent" />
        <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
          Give the gift you&apos;d give if you had all the time in the world.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
          Start with one person. It takes five minutes, and you&apos;ll never face the blank wall again.
        </p>
        <div className="mt-8">
          <Link href={"/start" as never}>
            <Button size="lg" className="h-12 rounded-full px-8 text-base">
              Find your first gift <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GiftMindMark className="h-4 w-4" />
            <span className="font-serif font-semibold text-foreground">GiftMind</span>
            <span className="hidden sm:inline">· the perfect gift for anyone in your life</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href={"/pricing" as never} className="hover:text-foreground">Pricing</Link>
            <Link href={"/login" as never} className="hover:text-foreground">Log in</Link>
            <Link href={"/legal/privacy" as never} className="hover:text-foreground">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
