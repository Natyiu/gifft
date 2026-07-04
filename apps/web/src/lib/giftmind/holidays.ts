// Universal gift-giving holidays for the calendar. Pure + shared: given a year,
// returns each holiday's concrete month/day (some are fixed dates, some are the
// Nth weekday of a month, and Easter is computed). These show up on the calendar
// and the "Coming up" list so people see every occasion worth a gift — not just
// the birthdays/anniversaries they've entered.

export type GiftHoliday = {
  type: string;
  label: string;
  emoji: string;
  month: number; // 0-11
  day: number;
};

/** Day-of-month of the Nth given weekday (0=Sun … 6=Sat) in a month. */
function nthWeekday(year: number, month: number, weekday: number, n: number): number {
  const firstDow = new Date(year, month, 1).getDay();
  const offset = (weekday - firstDow + 7) % 7;
  return 1 + offset + (n - 1) * 7;
}

/** Easter Sunday (Gregorian, Anonymous computus) → 0-based month + day. */
function easter(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month: month - 1, day };
}

/** The gift-giving holidays for a given calendar year. */
export function giftHolidays(year: number): GiftHoliday[] {
  const e = easter(year);
  return [
    { type: "new-year", label: "New Year's Day", emoji: "🎉", month: 0, day: 1 },
    { type: "valentines", label: "Valentine's Day", emoji: "❤️", month: 1, day: 14 },
    { type: "easter", label: "Easter", emoji: "🐣", month: e.month, day: e.day },
    { type: "mothers-day", label: "Mother's Day", emoji: "🌷", month: 4, day: nthWeekday(year, 4, 0, 2) },
    { type: "fathers-day", label: "Father's Day", emoji: "🪕", month: 5, day: nthWeekday(year, 5, 0, 3) },
    { type: "halloween", label: "Halloween", emoji: "🎃", month: 9, day: 31 },
    { type: "thanksgiving", label: "Thanksgiving", emoji: "🦃", month: 10, day: nthWeekday(year, 10, 4, 4) },
    { type: "christmas", label: "Christmas", emoji: "🎄", month: 11, day: 25 },
  ];
}
