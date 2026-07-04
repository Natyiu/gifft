// Build a valid iCalendar (.ics) file so occasions can live in the user's real
// device calendar. Pure + client-safe. Recurring occasions (no fixed year)
// become all-day events with a yearly RRULE; one-off occasions are single
// all-day events. Import once, or re-download whenever things change.

export type IcsEvent = {
  uid: string;
  title: string;
  month: number; // 0-11
  day: number;
  year: number | null; // null = recurring yearly (anchored at `anchorYear`)
  description?: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

// Escape per RFC 5545 (commas, semicolons, backslashes, newlines).
function esc(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function dateStamp(year: number, month: number, day: number): string {
  return `${year}${pad(month + 1)}${pad(day)}`;
}

/** Next calendar day (for an all-day event's exclusive DTEND). */
function nextDay(year: number, month: number, day: number): string {
  const d = new Date(year, month, day + 1);
  return dateStamp(d.getFullYear(), d.getMonth(), d.getDate());
}

export function buildIcs(events: IcsEvent[], anchorYear: number): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Gifft//Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Gifft — Gift occasions",
  ];

  for (const e of events) {
    const year = e.year ?? anchorYear;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@gifft`,
      `DTSTART;VALUE=DATE:${dateStamp(year, e.month, e.day)}`,
      `DTEND;VALUE=DATE:${nextDay(year, e.month, e.day)}`,
      `SUMMARY:${esc(e.title)}`,
      ...(e.description ? [`DESCRIPTION:${esc(e.description)}`] : []),
      ...(e.year === null ? ["RRULE:FREQ=YEARLY"] : []),
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  // RFC 5545 wants CRLF line endings.
  return lines.join("\r\n");
}

/** Trigger a browser download of an .ics file (client only). */
export function downloadIcs(filename: string, ics: string): void {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
