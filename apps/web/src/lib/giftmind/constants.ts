// GiftMind shared option sets — used by forms, generation, and display.

export type OptionDef = { value: string; label: string; emoji?: string };

export const RELATIONSHIPS: OptionDef[] = [
  { value: "partner", label: "Partner / spouse" },
  { value: "parent", label: "Parent" },
  { value: "child", label: "Child" },
  { value: "sibling", label: "Sibling" },
  { value: "friend", label: "Friend" },
  { value: "grandparent", label: "Grandparent" },
  { value: "colleague", label: "Colleague" },
  { value: "in-law", label: "In-law" },
  { value: "other", label: "Someone else" },
];

export const OCCASIONS: OptionDef[] = [
  { value: "birthday", label: "Birthday", emoji: "🎂" },
  { value: "christmas", label: "Christmas", emoji: "🎄" },
  { value: "anniversary", label: "Anniversary", emoji: "💍" },
  { value: "thank-you", label: "Thank you", emoji: "🙏" },
  { value: "just-because", label: "Just because", emoji: "✨" },
  { value: "housewarming", label: "Housewarming", emoji: "🏡" },
  { value: "new-baby", label: "New baby", emoji: "👶" },
  { value: "graduation", label: "Graduation", emoji: "🎓" },
  { value: "wedding", label: "Wedding", emoji: "💐" },
  { value: "get-well", label: "Get well", emoji: "🌿" },
  { value: "promotion", label: "Promotion / new job", emoji: "🚀" },
  { value: "valentines", label: "Valentine's", emoji: "❤️" },
  { value: "mothers-day", label: "Mother's Day", emoji: "🌷" },
  { value: "fathers-day", label: "Father's Day", emoji: "🪕" },
  { value: "retirement", label: "Retirement", emoji: "🌅" },
];

export const TONES: OptionDef[] = [
  { value: "practical", label: "Practical & useful", emoji: "🛠️" },
  { value: "sentimental", label: "Sentimental & meaningful", emoji: "💛" },
  { value: "fun", label: "Fun & surprising", emoji: "🎉" },
  { value: "luxury", label: "A luxurious treat", emoji: "🥂" },
  { value: "experience", label: "An experience, not an object", emoji: "🎟️" },
];

export const VIBES: OptionDef[] = [
  { value: "practical", label: "Practical" },
  { value: "sentimental", label: "Sentimental" },
  { value: "fun", label: "Fun" },
  { value: "luxury", label: "Luxury" },
];

export const SATURDAYS: OptionDef[] = [
  { value: "outdoors", label: "Out in nature" },
  { value: "home-projects", label: "Home projects" },
  { value: "social", label: "With people" },
  { value: "creative", label: "Making something" },
  { value: "relaxed", label: "Slow and cozy" },
  { value: "always-busy", label: "Always busy" },
];

export const HOME_STYLES: OptionDef[] = [
  { value: "minimalist", label: "Minimalist" },
  { value: "cozy", label: "Cozy" },
  { value: "practical", label: "Practical" },
  { value: "aesthetic", label: "Aesthetic" },
  { value: "collector", label: "A collector's" },
];

export const SPENDING_STYLES: OptionDef[] = [
  { value: "buys-freely", label: "Buys for themselves freely" },
  { value: "careful", label: "Careful with money" },
];

export const AESTHETICS: OptionDef[] = [
  { value: "classic", label: "Classic" },
  { value: "modern", label: "Modern" },
  { value: "quirky", label: "Quirky" },
  { value: "practical", label: "Practical" },
  { value: "luxurious", label: "Luxurious" },
];

export const AGE_RANGES: OptionDef[] = [
  { value: "kid", label: "Kid (under 13)" },
  { value: "teen", label: "Teen" },
  { value: "20s", label: "20s" },
  { value: "30s", label: "30s" },
  { value: "40s", label: "40s" },
  { value: "50s", label: "50s" },
  { value: "60s", label: "60s" },
  { value: "70+", label: "70+" },
];

// Concrete interest tags — the highest-signal, easiest input for users.
export const INTEREST_TAGS: OptionDef[] = [
  { value: "cooking", label: "Cooking", emoji: "🍳" },
  { value: "coffee", label: "Coffee & tea", emoji: "☕" },
  { value: "baking", label: "Baking", emoji: "🧁" },
  { value: "wine", label: "Wine & cocktails", emoji: "🍷" },
  { value: "fitness", label: "Fitness", emoji: "🏋️" },
  { value: "running", label: "Running", emoji: "🏃" },
  { value: "yoga", label: "Yoga & wellness", emoji: "🧘" },
  { value: "outdoors", label: "Outdoors & hiking", emoji: "🥾" },
  { value: "camping", label: "Camping", emoji: "🏕️" },
  { value: "gardening", label: "Gardening", emoji: "🌱" },
  { value: "reading", label: "Reading", emoji: "📚" },
  { value: "writing", label: "Writing & journaling", emoji: "✍️" },
  { value: "music", label: "Music", emoji: "🎧" },
  { value: "instruments", label: "Playing music", emoji: "🎸" },
  { value: "gaming", label: "Gaming", emoji: "🎮" },
  { value: "tech", label: "Tech & gadgets", emoji: "💻" },
  { value: "photography", label: "Photography", emoji: "📷" },
  { value: "art", label: "Art & drawing", emoji: "🎨" },
  { value: "crafts", label: "Crafts & DIY", emoji: "🧶" },
  { value: "fashion", label: "Fashion & style", emoji: "👗" },
  { value: "beauty", label: "Beauty & skincare", emoji: "💄" },
  { value: "travel", label: "Travel", emoji: "✈️" },
  { value: "home", label: "Home & decor", emoji: "🛋️" },
  { value: "pets", label: "Pets", emoji: "🐾" },
  { value: "sports", label: "Sports", emoji: "⚽" },
  { value: "movies", label: "Film & TV", emoji: "🎬" },
  { value: "foodie", label: "Foodie / eating out", emoji: "🍜" },
  { value: "selfcare", label: "Self-care & relaxing", emoji: "🛁" },
];

export const REACTIONS: OptionDef[] = [
  { value: "loved", label: "They loved it" },
  { value: "landed", label: "It landed well" },
  { value: "missed", label: "It missed" },
  { value: "unknown", label: "Not sure" },
];

// Warm avatar colors for the initials chip.
export const AVATAR_COLORS = [
  "#3f6f52", // pine
  "#c5733d", // terracotta
  "#a8512f", // rust
  "#7a6a3a", // olive gold
  "#5b6e4f", // sage
  "#8a5a4a", // clay
  "#4f6d6f", // teal-grey
  "#b08436", // amber
];

export function labelFor(options: OptionDef[], value: string | null | undefined) {
  if (!value) return null;
  return options.find((o) => o.value === value)?.label ?? value;
}

export function occasionMeta(value: string | null | undefined) {
  if (!value) return { label: "Occasion", emoji: "🎁" };
  const o = OCCASIONS.find((x) => x.value === value);
  return { label: o?.label ?? value, emoji: o?.emoji ?? "🎁" };
}

export function avatarColorFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
