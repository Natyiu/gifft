"use server";

import prisma from "@Batman/db";

import { getSession } from "@/lib/session";
import { type CalEvent } from "@/components/giftmind/calendar-view";
import { occasionMeta } from "@/lib/giftmind/constants";
import { giftHolidays } from "@/lib/giftmind/holidays";

export type CalendarData = { events: CalEvent[] };

export async function getCalendarData(): Promise<CalendarData> {
  const session = await getSession();
  const userId = session!.user.id;

  const [occasions, profiles] = await Promise.all([
    prisma.occasion.findMany({ where: { userId }, include: { profile: { select: { id: true, name: true } } } }),
    prisma.personProfile.findMany({ where: { userId, birthday: { not: null } }, select: { id: true, name: true, birthday: true } }),
  ]);

  const events: CalEvent[] = [];

  for (const o of occasions) {
    const meta = occasionMeta(o.type);
    events.push({
      profileId: o.profile.id,
      profileName: o.profile.name,
      type: o.type,
      emoji: meta.emoji,
      label: meta.label,
      month: o.date.getUTCMonth(),
      day: o.date.getUTCDate(),
      year: o.recurring ? null : o.date.getUTCFullYear(),
    });
  }

  const thisYear = new Date().getFullYear();
  for (const y of [thisYear, thisYear + 1, thisYear + 2]) {
    for (const h of giftHolidays(y)) {
      events.push({ profileId: null, profileName: h.label, type: h.type, emoji: h.emoji, label: h.label, month: h.month, day: h.day, year: y, holiday: true });
    }
  }

  for (const p of profiles) {
    if (!p.birthday) continue;
    if (occasions.some((o) => o.profileId === p.id && o.type === "birthday")) continue;
    const meta = occasionMeta("birthday");
    events.push({ profileId: p.id, profileName: p.name, type: "birthday", emoji: meta.emoji, label: meta.label, month: p.birthday.getUTCMonth(), day: p.birthday.getUTCDate(), year: null });
  }

  return { events };
}
