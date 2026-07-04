// Pure date helpers shared by server and client (no server-only import).

export const MS_DAY = 1000 * 60 * 60 * 24;

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Next occurrence of a month/day on or after `from` (default today). */
export function nextAnnualOccurrence(date: Date, from = startOfToday()): Date {
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const candidate = new Date(from.getFullYear(), month, day);
  candidate.setHours(0, 0, 0, 0);
  if (candidate.getTime() < from.getTime()) {
    candidate.setFullYear(from.getFullYear() + 1);
  }
  return candidate;
}

export function daysUntil(date: Date, from = startOfToday()): number {
  return Math.round((date.getTime() - from.getTime()) / MS_DAY);
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function countdownLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 0) return `${Math.abs(days)}d ago`;
  if (days < 31) return `in ${days} days`;
  const weeks = Math.round(days / 7);
  if (days < 60) return `in ${weeks} weeks`;
  const months = Math.round(days / 30);
  return `in ${months} months`;
}

export function ageInYears(birthday: Date, at = new Date()): number {
  let age = at.getFullYear() - birthday.getUTCFullYear();
  const m = at.getMonth() - birthday.getUTCMonth();
  if (m < 0 || (m === 0 && at.getDate() < birthday.getUTCDate())) age--;
  return age;
}
