import Image from "next/image";
import Link from "next/link";

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

const projects = [
  {
    number: "01",
    label: "AI Platform",
    title: "Roggy AI",
    description:
      "A no-code platform that bridges the gap between complex AI capabilities and real-world utility. Creators and businesses turn their domain-specific knowledge into custom ChatGPT-style chatbots — without sacrificing the flexibility power users need.",
    quote:
      "Make AI usable without removing the flexibility that power users require.",
    link: "https://roggy.site",
  },
  {
    number: "02",
    label: "Social Network",
    title: "Helix",
    description:
      "A social network built around exclusivity and meaningful connections. Each user can have only 46 friends — inspired by the 46 human chromosomes. These 46 people form your social DNA, your true inner circle.",
    link: "https://46friends.world",
    features: [
      {
        name: "46 Friend Limit",
        desc: "Adding someone new requires removing someone else. Relationships become intentional.",
      },
      {
        name: "Friend Rankings",
        desc: "Rank your friends — Top 7, Top 20, others. Rankings shape feed priority and social status.",
      },
      {
        name: "Social DNA",
        desc: "Just as 46 chromosomes define your biological uniqueness, your 46 friends define your social identity.",
      },
      {
        name: "Friend Score",
        desc: "Your influence is based on how many people include you in their 46.",
      },
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <BatLogo className="h-4 sm:h-5 w-auto text-foreground" />
              <div className="flex flex-col leading-none">
                <span className="font-semibold text-xs sm:text-sm tracking-widest uppercase">
                  Batman
                </span>
                <span className="hidden sm:block text-[9px] tracking-[0.25em] uppercase text-muted-foreground">
                  The Dark Knight
                </span>
              </div>
            </Link>
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-foreground h-8 px-3"
              >
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Header row */}
      <div className="pt-14 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-6 py-3 sm:py-4">
            <span className="font-mono text-xs sm:text-sm text-muted-foreground/30 shrink-0 w-6 sm:w-8 text-right">
              //
            </span>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
                About
              </span>
              <div className="h-px flex-1 bg-border/30" />
              <span className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
                The Developer
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <section className="border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row gap-8 sm:gap-10 items-start">
            {/* Photo with pattern */}
            <div className="relative shrink-0">
              {/* Dot pattern behind */}
              <div className="absolute -top-3 -left-3 w-28 h-28 sm:w-32 sm:h-32"
                style={{
                  backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
                  backgroundSize: "8px 8px",
                  opacity: 0.08,
                }}
              />
              {/* Corner lines */}
              <div className="absolute -top-2 -right-2 w-5 h-5 border-t border-r border-foreground/20" />
              <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b border-l border-foreground/20" />
              {/* Photo */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-sm overflow-hidden ring-1 ring-border/50">
                <Image
                  src="/founder.png"
                  alt="Founder"
                  fill
                  className="object-cover object-top grayscale"
                  priority
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <div className="h-px w-6 sm:w-8 bg-foreground" />
                <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
                  Developer & Founder
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-[1.15] mb-4 sm:mb-5">
                I build products.<br />
                <span className="text-muted-foreground/50">
                  End-to-end.
                </span>
              </h1>

              <div className="space-y-3 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg">
                <p>
                  My work currently centers on the intersection of AI tools and
                  developer-driven platforms, where the goal is to make complex
                  systems accessible through simple, robust products.
                </p>
                <p>
                  I prefer building real products over talking about them. My
                  experience spans the entire stack — from frontend and backend to
                  product infrastructure. I care deeply about understanding how
                  systems work at a fundamental level, rather than just assembling
                  pre-made tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects */}
      {projects.map((project) => (
        <section key={project.number} className="border-b border-border/50">
          {/* Project header row */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center gap-4 sm:gap-6 py-4 sm:py-5">
              <span className="font-mono text-xs sm:text-sm text-muted-foreground/30 shrink-0 w-6 sm:w-8 text-right">
                {project.number}
              </span>
              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <span className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-muted-foreground/50">
                  {project.label}
                </span>
                <div className="h-px flex-1 bg-border/30" />
                <span className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
                  {project.title}
                </span>
              </div>
            </div>
          </div>

          {/* Project content */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-10 sm:pb-14">
            <div className="max-w-2xl">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5 sm:mb-6">
                {project.description}
              </p>

              {project.quote && (
                <div className="border-l-2 border-foreground/20 pl-4 sm:pl-5 mb-5 sm:mb-6">
                  <p className="text-xs sm:text-sm text-muted-foreground/60 italic">
                    &ldquo;{project.quote}&rdquo;
                  </p>
                </div>
              )}

              {project.features && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {project.features.map((f) => (
                    <div key={f.name} className="space-y-1">
                      <p className="text-xs sm:text-sm font-medium text-foreground">
                        {f.name}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-5 sm:mt-6 text-xs font-mono text-foreground/70 hover:text-foreground transition-colors"
                >
                  <span>{project.link.replace("https://", "")}</span>
                  <svg
                    viewBox="0 0 12 12"
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M3 9L9 3M9 3H4.5M9 3V7.5" />
                  </svg>
                </a>
              )}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <BatLogo className="h-5 sm:h-6 w-auto text-foreground mx-auto mb-4 opacity-60" />
          <p className="text-xs sm:text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
            Interested in Batman? Clone the repo and start vibe coding.
          </p>
          <Link href="/signup">
            <Button className="h-9 px-6 text-sm font-medium bg-foreground text-background hover:bg-foreground/90">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-5 sm:py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <BatLogo className="h-3 sm:h-3.5 w-auto text-foreground opacity-60" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                  Batman
                </span>
                <span className="text-[8px] sm:text-[9px] tracking-[0.2em] uppercase text-muted-foreground/40">
                  The Dark Knight
                </span>
              </div>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground/60 text-center">
              &copy; {new Date().getFullYear()} Batman. The vibe coding
              boilerplate for builders who don&apos;t sleep.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
