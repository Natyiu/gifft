import Link from "next/link";
import { Gift, Plus, CalendarHeart, Sparkles } from "lucide-react";

import prisma from "@Batman/db";
import { getSession } from "@/lib/session";
import { getEntitlements } from "@/lib/actions/giftmind";
import { PersonAvatar } from "@/components/giftmind/person-avatar";
import { Button } from "@/components/ui/button";
import { occasionMeta } from "@/lib/giftmind/constants";
import { nextAnnualOccurrence, daysUntil, countdownLabel, startOfToday } from "@/lib/giftmind/dates";

export const dynamic = "force-dynamic";

type Upcoming = { label: string; emoji: string; date: Date; days: number } | null;

function nextOccasionFor(
  birthday: Date | null,
  occasions: { type: string; date: Date; recurring: boolean }[],
): Upcoming {
  const today = startOfToday();
  const candidates: { type: string; date: Date }[] = [];

  for (const o of occasions) {
    if (o.recurring) {
      candidates.push({ type: o.type, date: nextAnnualOccurrence(o.date, today) });
    } else if (o.date.getTime() >= today.getTime()) {
      candidates.push({ type: o.type, date: o.date });
    }
  }
  if (birthday) candidates.push({ type: "birthday", date: nextAnnualOccurrence(birthday, today) });

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.date.getTime() - b.date.getTime());
  const next = candidates[0];
  const meta = occasionMeta(next.type);
  return { label: meta.label, emoji: meta.emoji, date: next.date, days: daysUntil(next.date, today) };
}

export default async function PeoplePage() {
  const session = await getSession();
  const userId = session!.user.id;

  const [profiles, ent] = await Promise.all([
    prisma.personProfile.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        occasions: { select: { type: true, date: true, recurring: true } },
        _count: { select: { vaultEntries: true, generations: true } },
      },
    }),
    getEntitlements(userId),
  ]);

  const withNext = profiles.map((p) => ({
    profile: p,
    next: nextOccasionFor(p.birthday, p.occasions),
  }));

  const reminders = withNext
    .filter((p) => p.next && p.next.days <= 21)
    .sort((a, b) => a.next!.days - b.next!.days);

  return (
    <div className="rounded-[28px] bg-card p-6 shadow-sm md:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight">People you gift</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {profiles.length > 0
              ? "Everyone you find gifts for, in one place."
              : "Let's add the first person you want to find a gift for."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ent.plan === "free" && (
            <Link href={"/pricing" as never}>
              <Button variant="outline" size="sm" className="rounded-full">
                <Sparkles className="mr-1 h-3.5 w-3.5 text-accent" /> Upgrade
              </Button>
            </Link>
          )}
          <Link href={"/dashboard/people/new" as never}>
            <Button size="sm" className="rounded-full">
              <Plus className="mr-1 h-4 w-4" /> Add a person
            </Button>
          </Link>
        </div>
      </div>

      {reminders.length > 0 && (
        <div className="mb-6 rounded-2xl bg-primary/8 p-4">
          <div className="flex items-start gap-3">
            <CalendarHeart className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Coming up soon</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {reminders.slice(0, 4).map(({ profile, next }) => (
                  <Link
                    key={profile.id}
                    href={`/dashboard/people/${profile.id}` as never}
                    className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs shadow-sm hover:ring-1 hover:ring-primary/40 whitespace-nowrap"
                  >
                    <span>{next!.emoji}</span>
                    <span className="font-medium">
                      {profile.name}&apos;s {next!.label.toLowerCase()}
                    </span>
                    <span className="text-muted-foreground">{countdownLabel(next!.days)}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {profiles.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {withNext.map(({ profile, next }) => (
            <Link
              key={profile.id}
              href={`/dashboard/people/${profile.id}` as never}
              className="group flex flex-col rounded-3xl bg-muted/50 p-5 transition-all hover:bg-muted hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <PersonAvatar name={profile.name} color={profile.avatarColor} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-serif text-lg font-bold leading-tight">{profile.name}</p>
                  {profile.relationship && (
                    <p className="text-xs capitalize text-muted-foreground">{profile.relationship}</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex-1">
                {next ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-xs shadow-sm whitespace-nowrap">
                    <span>{next.emoji}</span>
                    <span className="font-medium text-foreground">{next.label}</span>
                    <span className="text-muted-foreground">· {countdownLabel(next.days)}</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No occasion saved yet</p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                <span>
                  {profile._count.vaultEntries} in vault · {profile._count.generations} searches
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-primary group-hover:underline">
                  <Gift className="h-3.5 w-3.5" /> Open
                </span>
              </div>
            </Link>
          ))}

          <Link
            href={"/dashboard/people/new" as never}
            className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-border p-5 text-center text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm font-medium">Add another person</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border-2 border-dashed border-border px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Gift className="h-7 w-7 text-primary" />
      </div>
      <h3 className="font-serif text-xl font-bold">No profiles yet</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Who&apos;s the first person you want to find a gift for? It takes about five minutes — and you&apos;ll
        never start from a blank wall again.
      </p>
      <Link href={"/dashboard/people/new" as never} className="mt-6 inline-block">
        <Button size="lg" className="rounded-full">
          <Plus className="mr-1 h-4 w-4" /> Add your first person
        </Button>
      </Link>
    </div>
  );
}
