"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarClock } from "lucide-react";

import { cn } from "@/lib/utils";
import { countdownLabel } from "@/lib/giftmind/dates";

export type CalEvent = {
  profileId: string | null; // null = a global gift-giving holiday
  profileName: string; // person's name, or the holiday name
  type: string;
  emoji: string;
  label: string;
  month: number; // 0-11
  day: number;
  year: number | null; // null = recurring annually
  holiday?: boolean;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function CalendarView({ events }: { events: CalEvent[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const monthEvents = useMemo(() => {
    const byDay: Record<number, CalEvent[]> = {};
    for (const e of events) {
      if (e.month !== month) continue;
      if (e.year !== null && e.year !== year) continue;
      (byDay[e.day] ??= []).push(e);
    }
    return byDay;
  }, [events, month, year]);

  // Every event rolled forward to its next occurrence, soonest first — so the
  // "Coming up" list gives an at-a-glance view of the year ahead.
  const upcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return events
      .map((e) => {
        let date: Date;
        if (e.year !== null) {
          date = new Date(e.year, e.month, e.day);
        } else {
          date = new Date(today.getFullYear(), e.month, e.day);
          if (date.getTime() < today.getTime()) date = new Date(today.getFullYear() + 1, e.month, e.day);
        }
        date.setHours(0, 0, 0, 0);
        const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
        return { e, date, days };
      })
      // Next ~13 months, so each holiday shows once (not this + next years too).
      .filter((x) => x.days >= 0 && x.days <= 400)
      .sort((a, b) => a.days - b.days);
  }, [events]);

  const eventHref = (e: CalEvent) =>
    e.holiday || !e.profileId ? "/dashboard/discover" : `/dashboard/people/${e.profileId}`;

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (d: number) =>
    d === now.getDate() && month === now.getMonth() && year === now.getFullYear();

  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_312px]">
      {/* Month grid */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold">
          {MONTHS[month]} {year}
        </h2>
        <div className="flex items-center gap-1">
          <button onClick={() => shift(-1)} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()); }}
            className="whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Today
          </button>
          <button onClick={() => shift(1)} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="px-1 pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {w}
          </div>
        ))}
        {cells.map((d, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square overflow-hidden rounded-xl border p-1 sm:aspect-auto sm:min-h-[88px]",
              d === null ? "border-transparent" : "border-border/60 bg-background/40",
              d !== null && isToday(d) && "border-primary/60 bg-primary/5",
            )}
          >
            {d !== null && (
              <>
                <div className={cn("px-0.5 text-xs font-bold tabular-nums leading-none sm:text-base", isToday(d) ? "text-primary" : "text-foreground")}>
                  {d}
                </div>
                <div className="mt-0.5 space-y-0.5">
                  {(monthEvents[d] ?? []).map((e, j) => (
                    <Link
                      key={j}
                      href={eventHref(e) as never}
                      title={e.holiday ? e.label : `${e.profileName} — ${e.label}`}
                      className={cn(
                        "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium text-foreground",
                        e.holiday ? "bg-primary/12 hover:bg-primary/20" : "bg-accent/15 hover:bg-accent/25",
                      )}
                    >
                      <span>{e.emoji}</span>
                      <span className="truncate">{e.profileName}</span>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      </div>

      {/* Coming up — the year ahead at a glance */}
      <aside className="h-fit rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-primary" />
          <h2 className="font-serif text-base font-bold tracking-tight">Coming up</h2>
          {upcoming.length > 0 && (
            <span className="ml-auto rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold text-primary">
              {upcoming.length}
            </span>
          )}
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming dates yet.</p>
        ) : (
          <ul className="thin-scrollbar space-y-0.5 lg:max-h-[560px] lg:overflow-y-auto lg:pr-1">
            {upcoming.map(({ e, date, days }, i) => (
              <li key={i}>
                <Link
                  href={eventHref(e) as never}
                  title={e.holiday ? e.label : `${e.profileName} — ${e.label}`}
                  className="group flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-muted"
                >
                  <span
                    className={cn(
                      "flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg leading-none",
                      days <= 7 ? "bg-primary/12 text-primary" : "bg-secondary/60 text-foreground",
                    )}
                  >
                    <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70">
                      {MONTHS[e.month].slice(0, 3)}
                    </span>
                    <span className="text-sm font-bold">{e.day}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold leading-tight text-foreground group-hover:text-primary">
                      {e.emoji} {e.profileName}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {e.holiday ? "Gift-giving occasion" : e.label}
                      {date.getFullYear() !== now.getFullYear() ? ` · ${date.getFullYear()}` : ""}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "shrink-0 text-[11px] font-medium",
                      days <= 7 ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {countdownLabel(days)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
