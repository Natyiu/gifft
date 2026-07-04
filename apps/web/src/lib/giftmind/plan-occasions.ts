// Occasions + seasons a user can build a gift plan around. Extends the shared
// OCCASIONS with a few calendar holidays and the four seasons, so a plan can be
// "Christmas", "Thanksgiving", or a looser "Winter / Holidays".

import { OCCASIONS, type OptionDef } from "@/lib/giftmind/constants";

export const PLAN_OCCASIONS: OptionDef[] = [
  ...OCCASIONS,
  { value: "thanksgiving", label: "Thanksgiving", emoji: "🦃" },
  { value: "new-year", label: "New Year", emoji: "🎉" },
  { value: "easter", label: "Easter", emoji: "🐣" },
  { value: "halloween", label: "Halloween", emoji: "🎃" },
  { value: "season-winter", label: "Winter / Holidays", emoji: "❄️" },
  { value: "season-spring", label: "Spring", emoji: "🌷" },
  { value: "season-summer", label: "Summer", emoji: "🌞" },
  { value: "season-fall", label: "Fall", emoji: "🍂" },
];

export function planOccasionMeta(value: string): { label: string; emoji: string } {
  const o = PLAN_OCCASIONS.find((x) => x.value === value);
  return { label: o?.label ?? value, emoji: o?.emoji ?? "🎁" };
}
