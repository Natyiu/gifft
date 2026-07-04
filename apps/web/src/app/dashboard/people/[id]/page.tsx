import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Archive, History, CalendarPlus, Gift } from "lucide-react";

import prisma from "@Batman/db";
import { getSession } from "@/lib/session";
import { getEntitlements } from "@/lib/actions/giftmind";
import { PersonAvatar } from "@/components/giftmind/person-avatar";
import { GeneratePanel } from "@/components/giftmind/generate-panel";
import { Button } from "@/components/ui/button";
import {
  labelFor,
  occasionMeta,
  SATURDAYS,
  HOME_STYLES,
  SPENDING_STYLES,
  AESTHETICS,
  RELATIONSHIPS,
  AGE_RANGES,
  INTEREST_TAGS,
  TONES,
} from "@/lib/giftmind/constants";
import { nextAnnualOccurrence, daysUntil, countdownLabel, formatShortDate } from "@/lib/giftmind/dates";

export const dynamic = "force-dynamic";

function buildCues(p: {
  hobbies: string | null;
  interests: string[];
  talksAbout: string | null;
  lovedPastGifts: string | null;
  neverBuyThemselves: string | null;
  lifeChanges: string | null;
  aesthetic: string | null;
}): string[] {
  const cues: string[] = [];
  const trim = (s: string) => (s.length > 70 ? s.slice(0, 67) + "…" : s);
  if (p.interests.length) {
    const names = p.interests.map((i) => labelFor(INTEREST_TAGS, i) ?? i).slice(0, 4).join(", ");
    cues.push(`Into ${names}`);
  }
  if (p.hobbies) cues.push(`Specifically: ${trim(p.hobbies)}`);
  if (p.talksAbout) cues.push(`Always talks about ${trim(p.talksAbout)}`);
  if (p.lovedPastGifts) cues.push(`Loved before: ${trim(p.lovedPastGifts)}`);
  if (p.neverBuyThemselves) cues.push(`Would never buy: ${trim(p.neverBuyThemselves)}`);
  if (p.lifeChanges) cues.push(`Lately: ${trim(p.lifeChanges)}`);
  const aes = labelFor(AESTHETICS, p.aesthetic);
  if (aes) cues.push(`${aes} taste`);
  if (cues.length === 0) cues.push("Thinking about who they really are…");
  return cues;
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const userId = session!.user.id;

  const profile = await prisma.personProfile.findFirst({
    where: { id, userId },
    include: {
      occasions: { orderBy: { date: "asc" } },
      generations: { orderBy: { createdAt: "desc" }, take: 6, include: { _count: { select: { ideas: true } } } },
      vaultEntries: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!profile) notFound();

  const ent = await getEntitlements(userId);
  const cues = buildCues(profile);

  const detail: { label: string; value: string }[] = [];
  const pushD = (label: string, v: string | null | undefined) => {
    if (v && v.trim()) detail.push({ label, value: v });
  };
  if (profile.interests.length) {
    pushD("Into", profile.interests.map((i) => labelFor(INTEREST_TAGS, i) ?? i).join(", "));
  }
  pushD("A free Saturday", labelFor(SATURDAYS, profile.freeSaturday));
  pushD("Talks about", profile.talksAbout);
  pushD("Their home", labelFor(HOME_STYLES, profile.homeStyle));
  pushD("Spending", labelFor(SPENDING_STYLES, profile.spendingStyle));
  pushD("Too much of", profile.tooMuchOf);
  pushD("Wants but never bought", profile.wantsButNeverBought);
  pushD("Loved gifts", profile.lovedPastGifts);
  pushD("Hobbies", profile.hobbies);
  pushD("Recently", profile.lifeChanges);
  pushD("Would never buy themselves", profile.neverBuyThemselves);
  pushD("Aesthetic", labelFor(AESTHETICS, profile.aesthetic));
  pushD("Notes", profile.notes);

  const ageLabel = labelFor(AGE_RANGES, profile.ageRange);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <PersonAvatar name={profile.name} color={profile.avatarColor} size="xl" />
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">{profile.name}</h1>
            <p className="mt-0.5 text-sm capitalize text-muted-foreground">
              {[labelFor(RELATIONSHIPS, profile.relationship), ageLabel]
                .filter(Boolean)
                .join(" · ") || "Profile"}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/people/${profile.id}/edit` as never}>
          <Button variant="outline" size="sm" className="rounded-full">
            <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left: generate + details */}
        <div className="space-y-6">
          <GeneratePanel
            profileId={profile.id}
            profileName={profile.name}
            cues={cues}
            ideasPerSearch={ent.ideasPerSearch}
          />

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 font-serif text-lg font-semibold">What we know about {profile.name.split(" ")[0]}</h2>
            {detail.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not much yet —{" "}
                <Link href={`/dashboard/people/${profile.id}/edit` as never} className="text-primary underline">
                  add a few details
                </Link>{" "}
                to make the ideas sharper.
              </p>
            ) : (
              <dl className="space-y-3">
                {detail.map((d) => (
                  <div key={d.label} className="grid grid-cols-[120px_1fr] gap-3">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{d.label}</dt>
                    <dd className="text-sm text-foreground">{d.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>

        {/* Right: occasions + history + vault */}
        <div className="space-y-6">
          {/* Occasions */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-serif text-base font-semibold">
                <CalendarPlus className="h-4 w-4 text-primary" /> Occasions
              </h2>
            </div>
            {profile.occasions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No occasions saved. Add a birthday on the edit screen.</p>
            ) : (
              <ul className="space-y-2">
                {profile.occasions.map((o) => {
                  const next = o.recurring ? nextAnnualOccurrence(o.date, today) : o.date;
                  const meta = occasionMeta(o.type);
                  const days = daysUntil(next, today);
                  return (
                    <li key={o.id} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{meta.emoji}</span>
                        <span className="font-medium">{meta.label}</span>
                        <span className="text-muted-foreground">{formatShortDate(next)}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{countdownLabel(days)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Past searches */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold">
              <History className="h-4 w-4 text-primary" /> Past searches
            </h2>
            {profile.generations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No searches yet — generate your first set above.</p>
            ) : (
              <ul className="space-y-2">
                {profile.generations.map((g) => (
                  <li key={g.id}>
                    <Link
                      href={`/dashboard/results/${g.id}` as never}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
                    >
                      <span className="capitalize">
                        {occasionMeta(g.occasion).emoji} {occasionMeta(g.occasion).label} ·{" "}
                        <span className="text-muted-foreground">{labelFor(TONES, g.tone)}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {g._count.ideas} ideas · {formatShortDate(g.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Gift vault for this person */}
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-serif text-base font-semibold">
              <Archive className="h-4 w-4 text-primary" /> Gift history
            </h2>
            {profile.vaultEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing logged yet. When you buy something, mark it — GiftMind won&apos;t suggest it again.
              </p>
            ) : (
              <ul className="space-y-2">
                {profile.vaultEntries.slice(0, 8).map((v) => (
                  <li key={v.id} className="flex items-start gap-2 text-sm">
                    <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span>
                      <span className="font-medium">{v.title}</span>
                      <span className="text-muted-foreground">
                        {v.year ? ` · ${v.year}` : ""}
                        {v.direction === "received" ? " · received" : ""}
                        {v.reaction && v.reaction !== "unknown" ? ` · ${v.reaction}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href={"/dashboard/vault" as never} className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
              Open the full vault →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
