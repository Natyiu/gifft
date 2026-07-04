import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Store,
  UserPlus,
  CalendarDays,
  ClipboardList,
  Archive,
  Heart,
} from "lucide-react";

const FEATURES = [
  { href: "/dashboard/people/new", label: "Add a person", desc: "Build their gift profile", icon: UserPlus },
  { href: "/dashboard/calendar", label: "Calendar", desc: "Never miss a date", icon: CalendarDays },
  { href: "/dashboard/planner", label: "Planner", desc: "Plan an occasion", icon: ClipboardList },
  { href: "/dashboard/vault", label: "Gift Vault", desc: "What you've given", icon: Archive },
  { href: "/dashboard/wishlist", label: "Wishlists", desc: "Share & collect ideas", icon: Heart },
];

export function DashboardHero() {
  return (
    <div className="space-y-4">
      {/* Primary CTA — the core action */}
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#ffb088] via-[#ff9563] to-[#f2662e] p-6 text-white shadow-sm dark:from-background dark:via-[#6b3016] dark:to-[#ff9563] sm:p-8">
        {/* decorative gifts */}
        <div className="pointer-events-none absolute -right-6 -top-8 hidden select-none text-[140px] leading-none opacity-15 sm:block">
          🎁
        </div>
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> AI gift finder
          </span>
          <h2 className="mt-3 font-serif text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            Find a gift they&apos;ll actually love
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/85 sm:text-base">
            Describe someone — their personality, interests, your relationship — and GiftMind generates
            hyper-specific, thoughtful gift ideas with the reasoning behind each one.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={"/dashboard/people/new" as never}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white px-7 py-3.5 text-sm sm:text-base font-bold text-[#ff9563] shadow-md transition-transform hover:scale-[1.02]"
            >
              <Sparkles className="h-5 w-5" /> Get personalized gift ideas
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href={"/dashboard/discover" as never}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-white/15 px-7 py-3.5 text-sm sm:text-base font-semibold backdrop-blur transition-colors hover:bg-white/25"
            >
              <Store className="h-5 w-5" /> Discover gift ideas
            </Link>
          </div>
        </div>
      </section>

      {/* Related features */}
      <div className="hidden grid-cols-2 gap-3 sm:grid-cols-3 lg:grid lg:grid-cols-5">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href as never}
            className="group flex min-h-[150px] flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </span>
              <span className="mt-3 block text-sm font-bold leading-tight group-hover:text-primary">{f.label}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{f.desc}</span>
            </div>
            <div className="mt-4 flex justify-end">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/70 text-foreground/70 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
