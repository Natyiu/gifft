"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarHeart } from "lucide-react";

import { getCalendarData } from "@/lib/loaders/calendar";
import { CalendarView } from "@/components/giftmind/calendar-view";

export function CalendarPageView() {
  const { data } = useQuery({ queryKey: ["calendar"], queryFn: () => getCalendarData() });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Gift calendar</p>
        <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold tracking-tight">
          <CalendarHeart className="h-6 w-6 text-primary" /> Every occasion, in one view
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Birthdays and anniversaries from every profile. Click a day to open that person and generate ideas.
        </p>
      </div>

      {!data ? (
        <div className="h-[520px] animate-pulse rounded-2xl bg-muted" />
      ) : data.events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          No dates yet. Add birthdays or anniversaries on a person&apos;s profile and they&apos;ll show up here.
        </div>
      ) : (
        <CalendarView events={data.events} />
      )}
    </div>
  );
}
