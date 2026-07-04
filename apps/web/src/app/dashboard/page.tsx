import Link from "next/link";
import { Plus } from "lucide-react";

import prisma from "@Batman/db";
import { getSession } from "@/lib/session";
import { PersonAvatar } from "@/components/giftmind/person-avatar";
import { DashboardCalendar, type CalMark, type CalRange } from "@/components/giftmind/dashboard-calendar";
import { occasionMeta } from "@/lib/giftmind/constants";
import { nextAnnualOccurrence, daysUntil, startOfToday } from "@/lib/giftmind/dates";
import { DashboardHero } from "@/components/giftmind/dashboard-hero";

export const dynamic = "force-dynamic";

type PersonVM = { id: string; name: string; rel: string | null; color: string | null };

export default async function DashboardPage() {
  const session = await getSession();
  const userId = session!.user.id;

  const [profiles, savedIdeas] = await Promise.all([
    prisma.personProfile.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { occasions: { select: { type: true, date: true, recurring: true } } },
    }),
    prisma.giftIdea.findMany({
      where: { run: { userId }, saved: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, searchQuery: true, imageUrl: true, priceText: true, estPrice: true },
    }),
  ]);

  // Brand-new account → show the curated sample so the dashboard looks alive.
  if (profiles.length === 0) return <SampleDashboard />;

  const today = startOfToday();

  // Calendar marks + featured next occasion
  const marks: CalMark[] = [];
  const upcoming: { date: Date; label: string; days: number }[] = [];
  for (const p of profiles) {
    const first = p.name.split(" ")[0];
    const events: { type: string; date: Date }[] = [];
    for (const o of p.occasions) {
      events.push({ type: o.type, date: o.recurring ? nextAnnualOccurrence(o.date, today) : o.date });
    }
    if (p.birthday) events.push({ type: "birthday", date: nextAnnualOccurrence(p.birthday, today) });
    for (const e of events) {
      marks.push({ month: e.date.getMonth(), day: e.date.getDate() });
      const days = daysUntil(e.date, today);
      if (days >= 0) upcoming.push({ date: e.date, label: `${first}'s ${occasionMeta(e.type).label}`, days });
    }
  }
  upcoming.sort((a, b) => a.days - b.days);
  const next = upcoming[0] ?? null;
  const featured = next ? { day: next.date.getDate(), month: next.date.getMonth(), label: next.label } : null;

  // Gift plans — group people by occasion type
  const planMap = new Map<string, PersonVM[]>();
  for (const p of profiles) {
    const seen = new Set<string>();
    for (const o of p.occasions) {
      if (seen.has(o.type)) continue;
      seen.add(o.type);
      const arr = planMap.get(o.type) ?? [];
      arr.push({ id: p.id, name: p.name, rel: p.relationship, color: p.avatarColor });
      planMap.set(o.type, arr);
    }
  }
  const plans = [...planMap.entries()]
    .map(([type, people]) => ({ type, meta: occasionMeta(type), people }))
    .sort((a, b) => b.people.length - a.people.length)
    .slice(0, 4);

  const people: PersonVM[] = profiles.map((p) => ({ id: p.id, name: p.name, rel: p.relationship, color: p.avatarColor }));

  const initMonth = next ? next.date.getMonth() : today.getMonth();
  const initYear = next ? next.date.getFullYear() : today.getFullYear();
  const range: CalRange | null = next
    ? { month: next.date.getMonth(), year: next.date.getFullYear(), start: next.date.getDate(), end: next.date.getDate() }
    : null;

  return (
    <div className="space-y-7">
      <DashboardHero />

      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCalendar marks={marks} range={range} featured={featured} initialMonth={initMonth} initialYear={initYear} />

        {/* Gift plans */}
        <section className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-base font-bold tracking-tight">Gift plans</h2>
          {plans.length === 0 ? (
            <EmptyHint text="Add an occasion to someone and your gift plans appear here." href="/dashboard/people" cta="Go to people" />
          ) : (
            <div className="space-y-4">
              {plans.map((plan, i) => (
                <Link
                  key={plan.type}
                  href={"/dashboard/calendar" as never}
                  className={
                    "block rounded-2xl p-4 transition-all " +
                    (i === 0 ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary/70 hover:bg-secondary")
                  }
                >
                  <p className="text-[15px] font-bold">
                    {plan.meta.emoji} {plan.meta.label}
                  </p>
                  <div className="mt-3">
                    <AvatarStack people={plan.people} ring={i === 0 ? "ring-primary" : "ring-card"} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* People you gift */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-base font-bold tracking-tight">People you gift</h2>
            <ul className="space-y-4">
              {people.slice(0, 2).map((p) => (
                <li key={p.id}>
                  <Link href={`/dashboard/people/${p.id}` as never} className="flex items-center gap-3 group">
                    <PersonAvatar name={p.name} color={p.color} size="md" />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold leading-tight group-hover:text-primary">{p.name}</p>
                      {p.rel && <p className="truncate text-[15px] capitalize text-muted-foreground">{p.rel}</p>}
                    </div>
                  </Link>
                </li>
              ))}
              {people.length > 2 && (
                <li>
                  <Link href={"/dashboard/people" as never} className="flex items-center gap-3">
                    <AvatarStack people={people.slice(2, 7)} ring="ring-card" />
                    <span className="text-[15px] font-semibold text-muted-foreground">{people.length - 2}+ people</span>
                  </Link>
                </li>
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-base font-bold tracking-tight">Wishlist</h2>
            {savedIdeas.length === 0 ? (
              <EmptyHint text="Save gift ideas and they'll collect here." href="/dashboard/people" cta="Find ideas" />
            ) : (
              <ul className="space-y-4">
                {savedIdeas.map((g) => (
                  <li key={g.id}>
                    <Link href={`/dashboard/gift/${g.id}` as never} className="flex items-center gap-4 group">
                      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-secondary/60 ring-1 ring-border">
                        {g.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={g.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[16px] font-bold leading-tight group-hover:text-primary">{g.name}</p>
                        <p className="text-[15px] font-semibold text-muted-foreground">{g.priceText || (g.estPrice ? `$${g.estPrice}` : "—")}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
        </section>
      </div>
    </div>
  );
}

function AvatarStack({ people, ring }: { people: PersonVM[]; ring: string }) {
  return (
    <div className="flex -space-x-3">
      {people.slice(0, 5).map((p) => (
        <PersonAvatar key={p.id} name={p.name} color={p.color} size="sm" className={`ring-2 ${ring}`} />
      ))}
    </div>
  );
}

function EmptyHint({ text, href, cta }: { text: string; href: string; cta: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-border p-5 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link href={href as never} className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-primary-foreground whitespace-nowrap">
        <Plus className="h-3.5 w-3.5" /> {cta}
      </Link>
    </div>
  );
}

/* ── Curated sample shown to brand-new accounts ───────────────────── */

const avatar = (img: number) => `https://i.pravatar.cc/120?img=${img}`;
const SAMPLE_PEOPLE = [
  { name: "Alex Rumo", rel: "Grand dad", img: 13 },
  { name: "Ruth Samuel", rel: "Bestie", img: 5 },
];
const SAMPLE_MORE = [12, 14, 33, 8, 60];
const SAMPLE_PLANS = [
  { title: "Christmass Gift", imgs: [13, 12, 14, 33, 5], active: true },
  { title: "Mother's day Gift", imgs: [60], active: false },
  { title: "Thanks Giving", imgs: [13, 14, 33], active: false },
];
const SAMPLE_WISHLIST = [
  { name: "Rolex watch", price: "$234" },
  { name: "Essential t-shirt", price: "$87" },
  { name: "Mechanical Keyboard", price: "$87" },
];

function PhotoAvatar({ img, size = 36, ring }: { img: number; size?: number; ring?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatar(img)} alt="" style={{ width: size, height: size }} className={`shrink-0 rounded-full object-cover ${ring ? `ring-2 ${ring}` : ""}`} loading="lazy" />
  );
}
function PhotoStack({ imgs, ring }: { imgs: number[]; ring: string }) {
  return (
    <div className="flex -space-x-3">
      {imgs.slice(0, 5).map((img, i) => (
        <PhotoAvatar key={i} img={img} ring={ring} />
      ))}
    </div>
  );
}

function SampleDashboard() {
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between rounded-2xl bg-primary/8 px-4 py-2.5">
        <p className="text-sm text-foreground/80">
          This is a sample. Add your first person to make it yours.
        </p>
        <Link href={"/dashboard/people/new" as never} className="inline-flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-primary-foreground whitespace-nowrap">
          <Plus className="h-3.5 w-3.5" /> Add a person
        </Link>
      </div>

      <DashboardHero />

      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCalendar initialMonth={8} initialYear={2025} range={{ month: 8, year: 2025, start: 9, end: 13 }} featured={{ day: 10, month: 0, label: "" }} />

        <section className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-base font-bold tracking-tight">Gift plans</h2>
          <div className="space-y-4">
            {SAMPLE_PLANS.map((plan) => (
              <div key={plan.title} className={"rounded-2xl p-4 " + (plan.active ? "bg-primary text-primary-foreground shadow-sm" : "bg-secondary/70")}>
                <p className="text-[15px] font-bold">{plan.title}</p>
                <div className="mt-3">
                  <PhotoStack imgs={plan.imgs} ring={plan.active ? "ring-primary" : "ring-card"} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-base font-bold tracking-tight">People you gift</h2>
            <ul className="space-y-4">
              {SAMPLE_PEOPLE.map((p) => (
                <li key={p.name} className="flex items-center gap-3">
                  <PhotoAvatar img={p.img} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold leading-tight">{p.name}</p>
                    <p className="truncate text-[15px] text-muted-foreground">{p.rel}</p>
                  </div>
                </li>
              ))}
              <li className="flex items-center gap-3">
                <PhotoStack imgs={SAMPLE_MORE} ring="ring-card" />
                <span className="text-[15px] font-semibold text-muted-foreground">7+ people</span>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-base font-bold tracking-tight">Wishlist</h2>
            <ul className="space-y-4">
              {SAMPLE_WISHLIST.map((w) => (
                <li key={w.name} className="flex items-center gap-4">
                  <span className="h-11 w-11 shrink-0 rounded-2xl bg-secondary/60 ring-1 ring-border" />
                  <div className="min-w-0">
                    <p className="truncate text-[16px] font-bold leading-tight">{w.name}</p>
                    <p className="text-[15px] font-semibold text-muted-foreground">{w.price}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
      </div>
    </div>
  );
}
