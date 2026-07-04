import "server-only";

import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

import {
  labelFor,
  OCCASIONS,
  TONES,
  SATURDAYS,
  HOME_STYLES,
  SPENDING_STYLES,
  AESTHETICS,
  AGE_RANGES,
  INTEREST_TAGS,
} from "./constants";
import { amazonSearchUrl } from "./media";

const MODEL = "gemini-2.5-flash";

export type ProfileForGeneration = {
  name: string;
  relationship?: string | null;
  gender?: string | null;
  ageYears?: number | null;
  ageRange?: string | null;
  interests?: string[];
  freeSaturday?: string | null;
  talksAbout?: string | null;
  homeStyle?: string | null;
  spendingStyle?: string | null;
  tooMuchOf?: string | null;
  wantsButNeverBought?: string | null;
  lovedPastGifts?: string | null;
  lifeChanges?: string | null;
  hobbies?: string | null;
  neverBuyThemselves?: string | null;
  aesthetic?: string | null;
  notes?: string | null;
};

export type GenerationParams = {
  occasion: string;
  tone: string;
  budgetMin: number;
  budgetMax: number;
  neverBuyFilter: boolean;
  count: number;
  alreadyGiven?: string[]; // titles to avoid repeating
  geminiKey?: string | null; // resolved server-side (Admin settings → env fallback)
};

export type GeneratedGift = {
  name: string;
  reason: string;
  about: string;
  type: "object" | "experience";
  vibe: "practical" | "sentimental" | "fun" | "luxury";
  splurgeWorthy: boolean;
  estPrice: number;
  priceText: string;
  searchQuery: string;
  buyUrl: string;
  cheaperAlt: string;
  premiumAlt: string;
  personalTouch: string;
};

export type GenerationResult = {
  gifts: GeneratedGift[];
  model: string | null;
  usedFallback: boolean;
};

function buyUrlFromQuery(query: string) {
  return amazonSearchUrl(query);
}

function profileSummary(p: ProfileForGeneration): string {
  const lines: string[] = [];
  const add = (label: string, v?: string | null) => {
    if (v && String(v).trim()) lines.push(`- ${label}: ${String(v).trim()}`);
  };
  add("Name", p.name);
  add("Your relationship to them", labelFor(RELATIONSHIPS_FALLBACK, p.relationship) ?? p.relationship ?? undefined);
  if (p.ageYears) add("Age", String(p.ageYears));
  else add("Age range", labelFor(AGE_RANGES, p.ageRange));
  add("Gender", p.gender);
  if (p.interests && p.interests.length) {
    const names = p.interests.map((i) => labelFor(INTEREST_TAGS, i) ?? i).join(", ");
    add("Things they're into", names);
  }
  add("How they spend a free Saturday", labelFor(SATURDAYS, p.freeSaturday));
  add("What they talk about most", p.talksAbout);
  add("What their home is like", labelFor(HOME_STYLES, p.homeStyle));
  add("How they spend on themselves", labelFor(SPENDING_STYLES, p.spendingStyle));
  add("What they already have too much of", p.tooMuchOf);
  add("Something they've mentioned wanting but never bought", p.wantsButNeverBought);
  add("Past gifts they genuinely loved", p.lovedPastGifts);
  add("Recent life changes", p.lifeChanges);
  add("Hobbies, in detail", p.hobbies);
  add("Things they'd never buy themselves but would love", p.neverBuyThemselves);
  add("Their aesthetic", labelFor(AESTHETICS, p.aesthetic));
  add("Anything else", p.notes);
  return lines.join("\n");
}

// relationships labels are duplicated minimally here to avoid a client import cycle
const RELATIONSHIPS_FALLBACK = [
  { value: "partner", label: "partner" },
  { value: "parent", label: "parent" },
  { value: "child", label: "child" },
  { value: "sibling", label: "sibling" },
  { value: "friend", label: "friend" },
  { value: "grandparent", label: "grandparent" },
  { value: "colleague", label: "colleague" },
  { value: "in-law", label: "in-law" },
];

const SYSTEM_PROMPT = `You are GiftMind — the gift-idea engine the whole product is built around. You think like a brilliant, attentive friend who actually knows the person being gifted and has an encyclopedic memory for specific, real-world products and small makers.

Your single job: turn a description of a real person into gift ideas so specific and well-reasoned that the gift-giver thinks "yes — that's exactly them." If a suggestion is something the user could have found by Googling "gifts for [category]", you have failed.

Hard rules for every gift:
1. SPECIFIC, never a category. Not "a nice candle" — "a hand-poured cedar-and-woodsmoke candle from a small-batch maker, the kind you'd never stumble on yourself." Name a concrete kind of object/experience with texture and detail. Real, buyable things (brands or maker archetypes are fine; do not invent fake brand names or fake URLs).
2. The REASON must reference something REAL and SPECIFIC from this person's profile, in one warm sentence. Quote or paraphrase their actual details ("you mentioned she got into sourdough last year — this leans right into that obsession"). Generic reasoning is a failure.
3. Respect the budget range as the primary price target. Most ideas should sit inside it.
4. Honor the requested tone, but vary the set so it feels considered, not one-note.
5. Avoid anything in the "already given" list, and don't suggest near-duplicates of it.
6. For each gift also give: a cheaper alternative, a more premium alternative, and one personal-touch suggestion that makes it feel handmade-thoughtful (engraving, a note tied to a shared memory, pairing, presentation).
7. "splurgeWorthy" = true when it's an indulgent thing they'd love but would never justify buying themselves.
8. "searchQuery" is a precise product search string (brand or maker + product type + a defining detail) that would surface the actual item on Amazon — no URLs, no fluff.
9. "about" is 2–3 sentences describing the real product: what it is, what makes it special, and why it suits this person. This is shown on the gift's own detail page, so make it concrete and vivid.

Write in warm, human, second-person voice ("she", "he", "they" as appropriate). Never hedge, never list a category. Every line should sound like it came from someone who thought hard about this exact person.`;

const giftSchema = z.object({
  gifts: z.array(
    z.object({
      name: z.string().describe("The specific, buyable gift — never a category"),
      reason: z.string().describe("One warm sentence tied to a real detail from this person's profile"),
      about: z.string().describe("2–3 vivid sentences about the real product for its detail page"),
      type: z.enum(["object", "experience"]),
      vibe: z.enum(["practical", "sentimental", "fun", "luxury"]),
      splurgeWorthy: z.boolean().describe("true if it's something they'd love but never buy themselves"),
      estPrice: z.number().int().describe("Estimated USD price as an integer"),
      priceText: z.string().describe('Human price like "~$45"'),
      searchQuery: z
        .string()
        .describe("A precise product search string (brand/maker + product type + defining detail) that would surface the real item on Amazon"),
      cheaperAlt: z.string(),
      premiumAlt: z.string(),
      personalTouch: z.string(),
    }),
  ),
});

function buildUserPrompt(profile: ProfileForGeneration, params: GenerationParams) {
  const occasion = labelFor(OCCASIONS, params.occasion) ?? params.occasion;
  const tone = labelFor(TONES, params.tone) ?? params.tone;
  const avoid =
    params.alreadyGiven && params.alreadyGiven.length
      ? `\n\nAlready given to this person (do NOT repeat or suggest near-duplicates):\n${params.alreadyGiven
          .map((t) => `- ${t}`)
          .join("\n")}`
      : "";
  const splurge = params.neverBuyFilter
    ? `\n\nSPECIAL FOCUS: lean hard into the "they'd never buy this themselves" angle — indulgent, slightly splurge-y things they'd secretly love. Mark those splurgeWorthy.`
    : "";

  return `Here is the person:

${profileSummary(profile)}

Occasion: ${occasion}
Tone wanted: ${tone}
Budget: $${params.budgetMin}–$${params.budgetMax}

Generate exactly ${params.count} gift ideas as JSON matching the schema. Make each one unmistakably about THIS person.${splurge}${avoid}`;
}

export async function generateGifts(
  profile: ProfileForGeneration,
  params: GenerationParams,
): Promise<GenerationResult> {
  const apiKey = (params.geminiKey ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY)?.trim();
  if (!apiKey) {
    return { gifts: fallbackGifts(profile, params), model: null, usedFallback: true };
  }

  try {
    // Vercel AI SDK + Gemini 2.5 Flash, constrained to our schema via generateObject.
    const google = createGoogleGenerativeAI({ apiKey });
    const { object } = await generateObject({
      model: google(MODEL),
      schema: giftSchema,
      system: SYSTEM_PROMPT,
      prompt: buildUserPrompt(profile, params),
    });

    const gifts = normalizeGifts(object.gifts ?? [], params);
    if (gifts.length === 0) {
      return { gifts: fallbackGifts(profile, params), model: null, usedFallback: true };
    }
    return { gifts, model: MODEL, usedFallback: false };
  } catch (err) {
    console.error("[GiftMind] generation failed, using fallback:", err);
    return { gifts: fallbackGifts(profile, params), model: null, usedFallback: true };
  }
}

function clampPrice(n: number | undefined, params: GenerationParams) {
  if (!n || !Number.isFinite(n)) return Math.round((params.budgetMin + params.budgetMax) / 2);
  return Math.max(1, Math.round(n));
}

function normalizeGifts(raw: Array<Partial<GeneratedGift>>, params: GenerationParams): GeneratedGift[] {
  return raw
    .filter((g) => g && g.name && g.reason)
    .slice(0, params.count)
    .map((g) => {
      const searchQuery = (g.searchQuery || g.name || "").toString();
      const estPrice = clampPrice(g.estPrice, params);
      return {
        name: String(g.name),
        reason: String(g.reason),
        about: g.about ? String(g.about) : String(g.reason),
        type: g.type === "experience" ? "experience" : "object",
        vibe: (["practical", "sentimental", "fun", "luxury"].includes(g.vibe as string)
          ? g.vibe
          : "practical") as GeneratedGift["vibe"],
        splurgeWorthy: Boolean(g.splurgeWorthy),
        estPrice,
        priceText: g.priceText ? String(g.priceText) : `~$${estPrice}`,
        searchQuery,
        buyUrl: buyUrlFromQuery(searchQuery),
        cheaperAlt: g.cheaperAlt ? String(g.cheaperAlt) : "",
        premiumAlt: g.premiumAlt ? String(g.premiumAlt) : "",
        personalTouch: g.personalTouch ? String(g.personalTouch) : "",
      };
    });
}

// ── Fallback generator ──────────────────────────────────────────────
// Used when no ANTHROPIC_API_KEY is configured. Still weaves the person's
// real details into the reasoning so the experience holds up in demo mode.

function firstPhrase(s?: string | null) {
  if (!s) return null;
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length > 80 ? t.slice(0, 77) + "…" : t;
}

function pronoun(p: ProfileForGeneration) {
  const g = (p.gender || "").toLowerCase();
  if (g.startsWith("f") || g.includes("woman") || g.includes("she")) return { subj: "she", obj: "her", pos: "her" };
  if (g.startsWith("m") || g.includes("man") || g.includes("he")) return { subj: "he", obj: "him", pos: "his" };
  return { subj: "they", obj: "them", pos: "their" };
}

export function fallbackGifts(profile: ProfileForGeneration, params: GenerationParams): GeneratedGift[] {
  const pr = pronoun(profile);
  const hobby = firstPhrase(profile.hobbies);
  const talks = firstPhrase(profile.talksAbout);
  const wants = firstPhrase(profile.wantsButNeverBought);
  const loved = firstPhrase(profile.lovedPastGifts);
  const never = firstPhrase(profile.neverBuyThemselves);
  const change = firstPhrase(profile.lifeChanges);
  const aesthetic = labelFor(AESTHETICS, profile.aesthetic)?.toLowerCase();
  const mid = Math.round((params.budgetMin + params.budgetMax) / 2);
  const lo = Math.max(params.budgetMin, Math.round(params.budgetMin * 0.6));
  const hi = Math.round(params.budgetMax * 1.6);

  type Seed = {
    name: string;
    reason: string;
    type: "object" | "experience";
    vibe: GeneratedGift["vibe"];
    splurgeWorthy: boolean;
    cheaperAlt: string;
    premiumAlt: string;
    personalTouch: string;
    buyQuery: string;
    price: number;
  };
  const seeds: Seed[] = [];
  const push = (s: Seed) => seeds.push(s);

  if (hobby)
    push({
      name: `A premium starter kit for ${pr.pos} ${hobby.split(" ").slice(0, 4).join(" ")} habit`,
      reason: `You said ${pr.subj} is into ${hobby} — this leans straight into the thing ${pr.subj} already loves doing.`,
      type: "object",
      vibe: "practical",
      splurgeWorthy: false,
      price: mid,
      buyQuery: `${hobby} premium kit gift`,
      cheaperAlt: `A single high-quality accessory for ${hobby}`,
      premiumAlt: `A full pro-level set or a class to go deeper`,
      personalTouch: `Add a handwritten note about the first time you saw ${pr.obj} get into it.`,
    });

  if (wants)
    push({
      name: `The exact thing ${pr.subj} mentioned: ${wants}`,
      reason: `${pr.subj[0].toUpperCase() + pr.subj.slice(1)} literally said ${pr.subj} wanted "${wants}" but never bought it — so beat ${pr.obj} to it.`,
      type: "object",
      vibe: "practical",
      splurgeWorthy: true,
      price: mid,
      buyQuery: wants,
      cheaperAlt: `A smaller version of "${wants}" to test the water`,
      premiumAlt: `The top-tier model of "${wants}"`,
      personalTouch: `Wrap it with a card that says "you mentioned this once — I remembered."`,
    });

  if (loved)
    push({
      name: `A thoughtful next-step on the gift ${pr.subj} loved: ${loved}`,
      reason: `${loved} clearly landed before — this builds on exactly that without repeating it.`,
      type: "object",
      vibe: "sentimental",
      splurgeWorthy: false,
      price: mid,
      buyQuery: `${loved} complementary gift`,
      cheaperAlt: `A small companion piece to "${loved}"`,
      premiumAlt: `An upgraded or collector's version`,
      personalTouch: `Reference how much ${pr.subj} loved the original in your note.`,
    });

  if (never)
    push({
      name: `An indulgent ${never} — the kind ${pr.subj} would never buy ${pr.obj}self`,
      reason: `You flagged ${never} as something ${pr.subj}'d love but never justify — that's exactly the gift only someone else can give.`,
      type: "object",
      vibe: "luxury",
      splurgeWorthy: true,
      price: hi,
      buyQuery: `luxury ${never}`,
      cheaperAlt: `A more modest take on ${never}`,
      premiumAlt: `The genuinely splurge-y version`,
      personalTouch: `Present it with "you'd never buy this for yourself, so I did."`,
    });

  if (talks)
    push({
      name: `Something tied to what ${pr.subj} always talks about: ${talks}`,
      reason: `${pr.subj[0].toUpperCase() + pr.subj.slice(1)} talks about ${talks} constantly — a gift in that world shows you actually listen.`,
      type: "object",
      vibe: "fun",
      splurgeWorthy: false,
      price: mid,
      buyQuery: `${talks} gift`,
      cheaperAlt: `A book or zine about ${talks}`,
      premiumAlt: `A standout statement piece about ${talks}`,
      personalTouch: `Quote one of ${pr.pos} go-to lines about it on the tag.`,
    });

  if (change)
    push({
      name: `A grounding gift for this season of life: ${change}`,
      reason: `With ${change} happening, something that makes this chapter softer is right on time.`,
      type: "object",
      vibe: "sentimental",
      splurgeWorthy: false,
      price: mid,
      buyQuery: `thoughtful gift for ${change}`,
      cheaperAlt: `A small comfort item for the transition`,
      premiumAlt: `A keepsake to mark the milestone`,
      personalTouch: `Add a note naming the change and that you're rooting for ${pr.obj}.`,
    });

  // Tone- and occasion-aware staples that still nod to the aesthetic.
  const aest = aesthetic ? ` in a ${aesthetic} style` : "";
  push({
    name: `A small-batch cedar-and-woodsmoke candle${aest}`,
    reason: `An easy, sensory win — the kind of object${aest ? ` (${aesthetic} and understated)` : ""} ${pr.subj} would never find on Amazon.`,
    type: "object",
    vibe: "sentimental",
    splurgeWorthy: false,
    price: lo,
    buyQuery: "small batch cedar woodsmoke candle artisan",
    cheaperAlt: "A single travel-size candle from the same maker",
    premiumAlt: "A three-scent gift set with a brass lid",
    personalTouch: "Light it once before wrapping so it arrives already 'lived in.'",
  });
  push({
    name: `An experience: a half-day workshop ${pr.subj} would actually enjoy`,
    reason: `Experiences beat clutter${hobby ? ` — especially one that plays into ${pr.pos} ${hobby}` : ""}, and you can do it together.`,
    type: "experience",
    vibe: "fun",
    splurgeWorthy: false,
    price: mid,
    buyQuery: hobby ? `${hobby} workshop class gift voucher` : "local workshop class gift voucher",
    cheaperAlt: "A single drop-in session",
    premiumAlt: "A multi-week course or a private session",
    personalTouch: "Book two spots so it doubles as time together.",
  });
  push({
    name: `A genuinely good everyday upgrade (the boring thing, done beautifully)`,
    reason: `${profile.spendingStyle === "careful" ? `Since ${pr.subj} is careful with money, ` : ""}upgrading something ${pr.subj} uses daily is quietly thoughtful.`,
    type: "object",
    vibe: "practical",
    splurgeWorthy: profile.spendingStyle === "careful",
    price: mid,
    buyQuery: "premium everyday essential gift",
    cheaperAlt: "A mid-range version of the same item",
    premiumAlt: "The heirloom-quality version that lasts decades",
    personalTouch: "Note why this 'unglamorous' gift is secretly the best one.",
  });
  push({
    name: `A 'taste of somewhere' set — small-producer pantry or treats`,
    reason: `Consumable, generous, and zero-clutter${profile.tooMuchOf ? ` — useful since ${pr.subj} already has too much ${profile.tooMuchOf}` : ""}.`,
    type: "object",
    vibe: "fun",
    splurgeWorthy: false,
    price: lo,
    buyQuery: "small producer artisan pantry gift set",
    cheaperAlt: "A single standout jar or bar",
    premiumAlt: "A curated monthly subscription",
    personalTouch: "Include a card with your own favourite from the set circled.",
  });
  push({
    name: `A piece of 'made by a person' art or print`,
    reason: `Something with a human behind it${aest ? `, chosen to fit ${pr.pos} ${aesthetic} taste` : ""} — the opposite of a gift card.`,
    type: "object",
    vibe: "sentimental",
    splurgeWorthy: false,
    price: mid,
    buyQuery: "independent artist print gift",
    cheaperAlt: "A smaller unframed print",
    premiumAlt: "A commissioned piece",
    personalTouch: "Frame it so it's ready to hang the moment it's opened.",
  });
  push({
    name: `A 'permission to rest' gift — a proper at-home ritual set`,
    reason: `If ${pr.subj} is ${profile.freeSaturday === "always-busy" ? "always busy" : "the type who pours into everyone else"}, the kindest gift is rest.`,
    type: "object",
    vibe: "luxury",
    splurgeWorthy: true,
    price: hi,
    buyQuery: "luxury at-home spa ritual set gift",
    cheaperAlt: "A single high-quality element of the ritual",
    premiumAlt: "A spa day booked for two",
    personalTouch: "Add a note literally giving permission to do nothing for an afternoon.",
  });
  push({
    name: `A subscription that keeps showing up all year`,
    reason: `A gift that arrives every month is a gift that keeps saying 'I was thinking of you.'`,
    type: "experience",
    vibe: "fun",
    splurgeWorthy: false,
    price: mid,
    buyQuery: hobby ? `${hobby} monthly subscription box` : "thoughtful monthly subscription box",
    cheaperAlt: "A three-month trial",
    premiumAlt: "A full year, prepaid",
    personalTouch: "Time the first delivery to land on the actual day.",
  });
  push({
    name: `A keepsake that turns a shared memory into an object`,
    reason: `Nothing beats a gift that points back to something the two of you share.`,
    type: "object",
    vibe: "sentimental",
    splurgeWorthy: false,
    price: mid,
    buyQuery: "custom keepsake personalized gift",
    cheaperAlt: "A printed photo in a simple frame",
    premiumAlt: "A custom-made commissioned keepsake",
    personalTouch: "Engrave a date or inside-joke only the two of you would get.",
  });
  push({
    name: `A 'level up the hobby' tool ${pr.subj} hasn't splurged on yet`,
    reason: hobby
      ? `The next piece of kit for ${pr.pos} ${hobby} that ${pr.subj}'d never spring for solo.`
      : `The next-level tool for whatever ${pr.subj} is currently obsessed with.`,
    type: "object",
    vibe: "practical",
    splurgeWorthy: true,
    price: hi,
    buyQuery: hobby ? `professional ${hobby} equipment` : "professional hobby equipment gift",
    cheaperAlt: "A quality accessory rather than the headline item",
    premiumAlt: "The flagship pro model",
    personalTouch: "Tuck in a note: 'figured it was time you had the good one.'",
  });
  push({
    name: `A cozy, tactile comfort object for the home`,
    reason: `${labelFor(HOME_STYLES, profile.homeStyle) ? `${pr.pos} ${labelFor(HOME_STYLES, profile.homeStyle)!.toLowerCase()} home ` : "Their home "}deserves one more thing that feels good to touch.`,
    type: "object",
    vibe: "sentimental",
    splurgeWorthy: false,
    price: mid,
    buyQuery: "luxury throw blanket natural fibre gift",
    cheaperAlt: "A pair of beautiful candles or a smaller textile",
    premiumAlt: "A heavyweight wool or alpaca throw",
    personalTouch: "Wash it once so it's soft and ready to use immediately.",
  });
  push({
    name: `A 'just for the joy of it' surprising little gadget`,
    reason: `Sometimes the best gift is the delightful thing ${pr.subj} would never think to ask for.`,
    type: "object",
    vibe: "fun",
    splurgeWorthy: false,
    price: lo,
    buyQuery: "delightful unexpected gadget gift under budget",
    cheaperAlt: "A pocket-size version",
    premiumAlt: "The deluxe edition",
    personalTouch: "Present it as the 'most useless, most fun' gift on purpose.",
  });

  push({
    name: `A beautiful hardcover book on something close to ${pr.pos} heart`,
    reason: talks
      ? `Tied to ${talks} — a thoughtful read beats another gadget.`
      : `A handsome book in a subject ${pr.subj} cares about lands every time.`,
    type: "object",
    vibe: "sentimental",
    splurgeWorthy: false,
    price: lo,
    buyQuery: talks ? `${talks} beautiful hardcover book` : "beautiful hardcover gift book",
    cheaperAlt: "A well-reviewed paperback on the same theme",
    premiumAlt: "A signed or collector's edition",
    personalTouch: "Write the date and a line about why you picked it on the first page.",
  });
  push({
    name: `An upgrade to their daily coffee or tea ritual`,
    reason: `Everyone has a morning ritual — making ${pr.pos} a little better is a daily reminder of you.`,
    type: "object",
    vibe: "practical",
    splurgeWorthy: false,
    price: mid,
    buyQuery: "premium pour over coffee or tea gift set",
    cheaperAlt: "A bag of single-origin beans or loose-leaf tea",
    premiumAlt: "A proper grinder or a ceremonial-grade set",
    personalTouch: "Pair it with their go-to order written on a tag.",
  });
  push({
    name: `A hard-to-kill plant in a genuinely nice pot`,
    reason: `A bit of life for ${pr.pos} space — low-effort, high-charm, and it grows with them.`,
    type: "object",
    vibe: "fun",
    splurgeWorthy: false,
    price: lo,
    buyQuery: "potted plant gift hard to kill nice planter",
    cheaperAlt: "A single propagation cutting in a small vessel",
    premiumAlt: "A statement plant in a designer planter",
    personalTouch: "Name the plant on a little tag — it always gets a laugh.",
  });
  push({
    name: `A premium notebook-and-pen set for the planner in them`,
    reason: `For someone who likes to capture ideas, the good notebook is the gift they'll actually use.`,
    type: "object",
    vibe: "practical",
    splurgeWorthy: false,
    price: lo,
    buyQuery: "premium notebook fountain pen gift set",
    cheaperAlt: "A single beautiful notebook",
    premiumAlt: "A leather-bound journal with a fine fountain pen",
    personalTouch: "Inscribe the inside cover with a short note.",
  });
  push({
    name: `A weekend treat: a great meal or a night away nearby`,
    reason: `An experience to look forward to beats one more object${profile.tooMuchOf ? ` (and avoids more ${profile.tooMuchOf})` : ""}.`,
    type: "experience",
    vibe: "luxury",
    splurgeWorthy: true,
    price: hi,
    buyQuery: "restaurant or boutique stay gift voucher",
    cheaperAlt: "A tasting menu for one evening",
    premiumAlt: "A full weekend away",
    personalTouch: "Offer to handle the logistics so all they do is show up.",
  });
  push({
    name: `A game or puzzle for their next get-together`,
    reason: `A gift that turns into an evening with people ${pr.subj} loves — that's the real present.`,
    type: "object",
    vibe: "fun",
    splurgeWorthy: false,
    price: lo,
    buyQuery: "beautiful board game or puzzle gift",
    cheaperAlt: "A compact card game",
    premiumAlt: "A deluxe edition with wooden pieces",
    personalTouch: "Promise to be the first to play it with them.",
  });

  // Adjust vibe weighting toward the requested tone, then take `count`.
  const toneVibe: Record<string, GeneratedGift["vibe"]> = {
    practical: "practical",
    sentimental: "sentimental",
    fun: "fun",
    luxury: "luxury",
    experience: "fun",
  };
  const targetVibe = toneVibe[params.tone];
  seeds.sort((a, b) => {
    const av = a.vibe === targetVibe ? 0 : 1;
    const bv = b.vibe === targetVibe ? 0 : 1;
    if (params.neverBuyFilter && a.splurgeWorthy !== b.splurgeWorthy) return a.splurgeWorthy ? -1 : 1;
    return av - bv;
  });

  return seeds.slice(0, params.count).map((s) => {
    const price = clampPrice(s.price, params);
    const about = `${s.reason}${s.personalTouch ? ` A thoughtful touch: ${s.personalTouch.charAt(0).toLowerCase()}${s.personalTouch.slice(1)}` : ""}`;
    return {
      name: s.name,
      reason: s.reason,
      about,
      type: s.type,
      vibe: s.vibe,
      splurgeWorthy: s.splurgeWorthy,
      estPrice: price,
      priceText: `~$${price}`,
      searchQuery: s.buyQuery,
      buyUrl: buyUrlFromQuery(s.buyQuery),
      cheaperAlt: s.cheaperAlt,
      premiumAlt: s.premiumAlt,
      personalTouch: s.personalTouch,
    } satisfies GeneratedGift;
  });
}
