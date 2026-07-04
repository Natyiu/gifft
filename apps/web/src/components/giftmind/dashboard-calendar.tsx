"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export type CalMark = { month: number; day: number };
export type CalRange = { month: number; year: number; start: number; end: number };

export function DashboardCalendar({
  marks = [],
  range = null,
  initialMonth,
  initialYear,
  featured,
}: {
  marks?: CalMark[];
  range?: CalRange | null;
  initialMonth: number;
  initialYear: number;
  featured: { day: number; month: number; label: string } | null;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);

  const years = Array.from({ length: 7 }, (_, i) => initialYear - 1 + i);
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const marked = new Set(marks.filter((m) => m.month === month).map((m) => m.day));
  const rangeActive = range && range.month === month && range.year === year;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function prev() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-base font-bold tracking-tight">Calendar</h2>

      <div className="mb-3 flex items-center gap-2">
        <button onClick={prev} className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-muted hover:text-foreground" aria-label="Previous month">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <Select value={month} onChange={setMonth} options={MONTHS.map((m, i) => ({ value: i, label: m }))} />
        <Select value={year} onChange={setYear} options={years.map((y) => ({ value: y, label: String(y) }))} />
        <button onClick={next} className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-muted hover:text-foreground" aria-label="Next month">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center">
        {DOW.map((d) => (
          <div key={d} className="pb-1.5 text-[12px] font-medium text-muted-foreground">{d}</div>
        ))}
        {cells.map((d, i) => {
          const inRange = rangeActive && d !== null && d >= range!.start && d <= range!.end;
          const isStart = rangeActive && d === range!.start;
          const isEnd = rangeActive && d === range!.end;
          const endpoint = isStart || isEnd;
          const solid = endpoint || (d !== null && marked.has(d));
          return (
            <div
              key={i}
              className={cn(
                "flex h-8 items-center justify-center",
                inRange && "bg-secondary",
                isStart && "rounded-l-full",
                isEnd && "rounded-r-full",
              )}
            >
              {d === null ? null : (
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-medium",
                    solid ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground",
                  )}
                >
                  {d}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {featured && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-primary p-3.5 text-primary-foreground">
          <div className="flex h-[60px] w-[60px] shrink-0 flex-col items-center justify-center rounded-2xl bg-card font-bold leading-none text-primary">
            <span className="text-[24px]">{featured.day}</span>
            <span className="text-[15px]">{MONTHS_SHORT[featured.month]}</span>
          </div>
          {featured.label && <p className="text-sm font-semibold leading-snug">{featured.label}</p>}
        </div>
      )}
    </div>
  );
}

function Select<T extends number>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as T)}
        className="appearance-none rounded-xl bg-muted/70 py-2 pl-3.5 pr-9 text-[14px] font-medium text-foreground outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
    </div>
  );
}
