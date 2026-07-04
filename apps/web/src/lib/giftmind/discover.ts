// Discover — the curated gift *discovery* dataset (an editorial magazine, not a
// store). Four independent filtering layers work together: occasion, persona,
// price range, and niche category. Keyless + static: imagery comes from
// productImageUrl, buy-throughs go to affiliate search links. Swap in a real
// product feed later without touching the UI.

export type OptionDef = { value: string; label: string; emoji?: string };

// ── Layer 1: Occasion ───────────────────────────────────────────────
export const DISCOVER_OCCASIONS: OptionDef[] = [
  { value: "birthday", label: "Birthday", emoji: "🎂" },
  { value: "christmas", label: "Christmas", emoji: "🎄" },
  { value: "anniversary", label: "Anniversary", emoji: "💍" },
  { value: "housewarming", label: "Housewarming", emoji: "🏡" },
  { value: "graduation", label: "Graduation", emoji: "🎓" },
  { value: "new-baby", label: "New Baby", emoji: "👶" },
];

// ── Layer 2: Persona ────────────────────────────────────────────────
export const PERSONAS: OptionDef[] = [
  { value: "coffee-lover", label: "Coffee lover", emoji: "☕" },
  { value: "homebody", label: "Homebody", emoji: "🛋️" },
  { value: "traveler", label: "Traveler", emoji: "✈️" },
  { value: "fitness-person", label: "Fitness person", emoji: "🏋️" },
  { value: "bookworm", label: "Bookworm", emoji: "📚" },
  { value: "gamer", label: "Gamer", emoji: "🎮" },
  { value: "creative", label: "Creative", emoji: "🎨" },
];

// ── Layer 3: Price range ────────────────────────────────────────────
export type PriceRange = { value: string; label: string; min: number; max: number };

export const PRICE_RANGES: PriceRange[] = [
  { value: "under-25", label: "Under $25", min: 0, max: 25 },
  { value: "25-50", label: "$25–$50", min: 25, max: 50 },
  { value: "50-100", label: "$50–$100", min: 50, max: 100 },
  { value: "100-200", label: "$100–$200", min: 100, max: 200 },
  { value: "splurge", label: "Splurge", min: 200, max: Infinity },
];

// ── Layer 4: Niche category (the horizontal pill row) ───────────────
export const NICHES: OptionDef[] = [
  { value: "electronics", label: "Electronics", emoji: "🔌" },
  { value: "fitness", label: "Fitness", emoji: "🏋️" },
  { value: "home-kitchen", label: "Home & Kitchen", emoji: "🍳" },
  { value: "beauty", label: "Beauty", emoji: "💄" },
  { value: "fashion", label: "Fashion", emoji: "🧥" },
  { value: "books", label: "Books", emoji: "📚" },
  { value: "food-drink", label: "Food & Drink", emoji: "🍫" },
  { value: "outdoors", label: "Outdoors", emoji: "🏕️" },
  { value: "pets", label: "Pets", emoji: "🐾" },
  { value: "experiences", label: "Experiences", emoji: "🎟️" },
];

// ── Badges ──────────────────────────────────────────────────────────
export type Badge = "most-gifted" | "top-rated" | "editors-pick";

export const BADGE_LABEL: Record<Badge, string> = {
  "most-gifted": "Most Gifted",
  "top-rated": "Top Rated",
  "editors-pick": "Editor's Pick",
};

// ── Product ─────────────────────────────────────────────────────────
export type DiscoverProduct = {
  id: string;
  name: string; // a specific product, never a category
  rationale: string; // one-sentence gift rationale
  price: number;
  rating: number; // out of 5
  reviews: number;
  niche: string;
  personas: string[];
  occasions: string[];
  badge?: Badge;
  editorial?: boolean; // universally giftable → shows in the default mixed feed
  searchQuery: string; // drives the image + affiliate buy-through
};

export const DISCOVER_PRODUCTS: DiscoverProduct[] = [
  // Electronics
  { id: "aurora-earbuds", name: "Aurora Wireless Noise-Cancelling Earbuds", rationale: "The one gadget almost everyone wants but rarely buys for themselves.", price: 129, rating: 4.8, reviews: 8420, niche: "electronics", personas: ["traveler", "gamer", "homebody"], occasions: ["birthday", "christmas", "graduation"], badge: "most-gifted", editorial: true, searchQuery: "wireless noise cancelling earbuds" },
  { id: "lumafold-powerbank", name: "LumaFold 20K MagSafe Power Bank", rationale: "A pocketable charge for two devices — the traveler's quiet hero.", price: 69, rating: 4.7, reviews: 7240, niche: "electronics", personas: ["traveler", "gamer"], occasions: ["birthday", "graduation", "christmas"], editorial: true, searchQuery: "20000mah magsafe portable charger power bank" },
  { id: "luma-smart-frame", name: "Luma 10\" WiFi Smart Photo Frame", rationale: "Send photos from anywhere — the gift grandparents and new parents adore.", price: 159, rating: 4.6, reviews: 3990, niche: "electronics", personas: ["homebody"], occasions: ["christmas", "anniversary", "new-baby"], badge: "editors-pick", searchQuery: "wifi smart digital photo frame" },
  { id: "glowbar-ringlight", name: "GlowBar Clip-On Ring Light", rationale: "Flattering light for every call, selfie, and stream in one clip.", price: 24, rating: 4.5, reviews: 5120, niche: "electronics", personas: ["creative", "gamer"], occasions: ["birthday", "graduation"], searchQuery: "clip on ring light phone laptop" },
  { id: "novapods-speaker", name: "NovaPods Waterproof Bluetooth Speaker", rationale: "Big, warm sound that follows them from kitchen to campsite.", price: 89, rating: 4.7, reviews: 6610, niche: "electronics", personas: ["traveler", "homebody"], occasions: ["birthday", "christmas", "housewarming"], badge: "top-rated", editorial: true, searchQuery: "waterproof portable bluetooth speaker" },
  { id: "nimbus-keyboard", name: "Nimbus 65% Hot-Swap Mechanical Keyboard", rationale: "A satisfying, customizable upgrade for anyone at a desk all day.", price: 139, rating: 4.7, reviews: 6327, niche: "electronics", personas: ["gamer", "creative"], occasions: ["birthday", "christmas", "graduation"], badge: "top-rated", editorial: true, searchQuery: "65 percent hot swap mechanical keyboard rgb" },
  { id: "pixel-console", name: "Pixel Retro Handheld Game Console", rationale: "Hundreds of pocket classics on a crisp screen — pure nostalgia.", price: 119, rating: 4.5, reviews: 3870, niche: "electronics", personas: ["gamer", "traveler"], occasions: ["birthday", "christmas"], badge: "most-gifted", editorial: true, searchQuery: "retro handheld game console emulator" },
  { id: "starlight-projector", name: "Starlight Nursery Projector & Sound", rationale: "Drifts a galaxy across the ceiling with soothing white noise.", price: 45, rating: 4.6, reviews: 4510, niche: "electronics", personas: ["homebody"], occasions: ["new-baby", "birthday"], searchQuery: "nursery star projector sound machine" },

  // Fitness
  { id: "pulse-smartwatch", name: "Pulse GPS Fitness Smartwatch", rationale: "Heart-rate, GPS, and sleep in a bright watch that lasts a week.", price: 199, rating: 4.6, reviews: 9120, niche: "fitness", personas: ["fitness-person", "traveler"], occasions: ["birthday", "christmas", "graduation"], badge: "most-gifted", editorial: true, searchQuery: "gps fitness smartwatch amoled" },
  { id: "flowstate-bottle", name: "FlowState 32oz Insulated Water Bottle", rationale: "Ice-cold all day — the gift they'll actually use every single day.", price: 35, rating: 4.8, reviews: 15230, niche: "fitness", personas: ["fitness-person", "traveler"], occasions: ["birthday", "graduation"], badge: "most-gifted", editorial: true, searchQuery: "insulated stainless steel water bottle 32oz" },
  { id: "zen-yoga-set", name: "Zen Cork Yoga Mat & Block Set", rationale: "Grippy natural cork that only gets better the more they flow.", price: 72, rating: 4.7, reviews: 1430, niche: "fitness", personas: ["fitness-person", "homebody"], occasions: ["birthday", "christmas"], editorial: true, searchQuery: "cork yoga mat block set eco" },
  { id: "recoverpro-massage", name: "RecoverPro Percussion Massage Gun", rationale: "Melts post-workout knots — a spa day that lives in a drawer.", price: 129, rating: 4.6, reviews: 5380, niche: "fitness", personas: ["fitness-person"], occasions: ["christmas", "birthday"], badge: "editors-pick", searchQuery: "percussion massage gun muscle recovery" },
  { id: "rebound-bands", name: "Rebound Resistance Band Set", rationale: "A whole gym that rolls up into a bag — perfect for small spaces.", price: 28, rating: 4.5, reviews: 4210, niche: "fitness", personas: ["fitness-person"], occasions: ["birthday", "christmas"], searchQuery: "resistance bands set home workout" },

  // Home & Kitchen
  { id: "terra-dutch-oven", name: "Terra Enameled Cast-Iron Dutch Oven 6qt", rationale: "Braises, breads, and stews — goes from oven straight to the table.", price: 169, rating: 4.8, reviews: 3010, niche: "home-kitchen", personas: ["homebody"], occasions: ["housewarming", "anniversary", "christmas"], badge: "top-rated", editorial: true, searchQuery: "enameled cast iron dutch oven" },
  { id: "haven-throw", name: "Haven Chunky-Knit Merino Throw", rationale: "Oversized, breathable merino that instantly dresses up any sofa.", price: 98, rating: 4.7, reviews: 2090, niche: "home-kitchen", personas: ["homebody"], occasions: ["housewarming", "christmas", "anniversary"], editorial: true, searchQuery: "chunky knit merino wool throw blanket" },
  { id: "candle-trio", name: "Hand-Poured Soy Candle Trio", rationale: "Three slow-burning scents — the safest, most-loved little luxury.", price: 54, rating: 4.6, reviews: 2650, niche: "home-kitchen", personas: ["homebody"], occasions: ["housewarming", "christmas", "birthday"], badge: "most-gifted", editorial: true, searchQuery: "hand poured soy candle gift set amber" },
  { id: "forge-knife", name: "Forge 8\" Damascus Chef's Knife", rationale: "A hand-finished blade that makes every home cook feel like a pro.", price: 119, rating: 4.9, reviews: 1890, niche: "home-kitchen", personas: ["homebody"], occasions: ["housewarming", "anniversary"], badge: "top-rated", searchQuery: "damascus steel chef knife wood handle" },
  { id: "aurora-diffuser", name: "Aurora Ceramic Aroma Diffuser", rationale: "Whisper-quiet mist and a soft amber glow for wind-down evenings.", price: 59, rating: 4.6, reviews: 2740, niche: "home-kitchen", personas: ["homebody"], occasions: ["housewarming", "new-baby", "christmas"], editorial: true, searchQuery: "ceramic essential oil aroma diffuser warm light" },
  { id: "muslin-swaddle", name: "Organic Muslin Swaddle 4-Pack", rationale: "Buttery-soft, breathable swaddles new parents can never have too many of.", price: 38, rating: 4.8, reviews: 6720, niche: "home-kitchen", personas: ["homebody"], occasions: ["new-baby"], badge: "most-gifted", searchQuery: "organic muslin swaddle blanket set" },

  // Beauty
  { id: "glow-vitc-set", name: "Glow Vitamin-C Brightening Skincare Set", rationale: "Serum, moisturizer, and SPF for an everyday radiance routine.", price: 78, rating: 4.5, reviews: 5210, niche: "beauty", personas: ["homebody"], occasions: ["birthday", "christmas"], badge: "most-gifted", editorial: true, searchQuery: "vitamin c brightening skincare serum set" },
  { id: "silk-pillow", name: "Mulberry Silk Pillowcase Pair", rationale: "Kinder on hair and skin — an everyday touch of quiet luxury.", price: 66, rating: 4.6, reviews: 4410, niche: "beauty", personas: ["homebody"], occasions: ["anniversary", "birthday", "christmas"], editorial: true, searchQuery: "mulberry silk pillowcase set" },
  { id: "lumi-spa-basket", name: "Lumi At-Home Spa Gift Basket", rationale: "A ready-made evening of bubbles, balms, and calm.", price: 45, rating: 4.5, reviews: 3120, niche: "beauty", personas: ["homebody"], occasions: ["birthday", "christmas", "new-baby"], badge: "editors-pick", searchQuery: "spa gift basket bath set" },
  { id: "velvet-lip-trio", name: "Velvet Matte Lip Trio", rationale: "Three flattering, all-day shades in one giftable little box.", price: 22, rating: 4.4, reviews: 2890, niche: "beauty", personas: ["creative"], occasions: ["birthday", "christmas"], searchQuery: "matte liquid lipstick set" },

  // Fashion
  { id: "cashmere-scarf", name: "Cashmere-Blend Ribbed Scarf", rationale: "Impossibly soft and it flatters absolutely everyone on your list.", price: 58, rating: 4.7, reviews: 1980, niche: "fashion", personas: ["traveler", "homebody"], occasions: ["christmas", "birthday", "anniversary"], editorial: true, searchQuery: "cashmere blend ribbed scarf" },
  { id: "leather-wallet", name: "Full-Grain Leather Slim Wallet", rationale: "Ages beautifully with RFID protection — a classic they'll carry daily.", price: 49, rating: 4.6, reviews: 6740, niche: "fashion", personas: ["traveler"], occasions: ["graduation", "birthday", "anniversary"], badge: "most-gifted", editorial: true, searchQuery: "full grain leather slim wallet rfid" },
  { id: "sunday-sunglasses", name: "Sunday Polarized Sunglasses", rationale: "Glare-free and effortlessly cool for road trips and rooftops alike.", price: 32, rating: 4.4, reviews: 3410, niche: "fashion", personas: ["traveler"], occasions: ["birthday", "graduation"], searchQuery: "polarized sunglasses unisex" },
  { id: "cozy-socks", name: "Merino Wool Cozy Sock 3-Pack", rationale: "The stocking-filler people are secretly thrilled to receive.", price: 28, rating: 4.6, reviews: 4520, niche: "fashion", personas: ["homebody"], occasions: ["christmas", "birthday"], searchQuery: "merino wool socks gift set" },

  // Books
  { id: "novel-of-month", name: "Signed First-Edition Novel of the Month", rationale: "A curated hardcover arrives each month — a gift that keeps giving.", price: 35, rating: 4.8, reviews: 980, niche: "books", personas: ["bookworm"], occasions: ["birthday", "christmas", "graduation"], badge: "editors-pick", editorial: true, searchQuery: "signed first edition hardcover novel" },
  { id: "lumen-ereader", name: "Lumen Glare-Free E-Reader 7\"", rationale: "A warm front-light and weeks of battery — a library in one hand.", price: 189, rating: 4.6, reviews: 3402, niche: "books", personas: ["bookworm", "traveler"], occasions: ["birthday", "christmas", "graduation"], badge: "most-gifted", editorial: true, searchQuery: "glare free e-reader tablet warm light" },
  { id: "cooks-atlas", name: "The Cook's Atlas Illustrated Cookbook", rationale: "A gorgeous, story-driven cookbook that earns a spot on the counter.", price: 40, rating: 4.7, reviews: 2210, niche: "books", personas: ["homebody", "creative"], occasions: ["housewarming", "christmas"], searchQuery: "illustrated cookbook hardcover" },
  { id: "leather-journal", name: "Refillable Leather-Bound Journal", rationale: "A handsome place for plans, sketches, and half-formed ideas.", price: 34, rating: 4.7, reviews: 5120, niche: "books", personas: ["bookworm", "creative", "traveler"], occasions: ["graduation", "birthday"], badge: "most-gifted", editorial: true, searchQuery: "refillable leather journal notebook" },
  { id: "keepsake-book", name: "First-Year Keepsake Memory Book", rationale: "A beautiful record of every first — the keepsake parents treasure most.", price: 32, rating: 4.8, reviews: 3210, niche: "books", personas: ["creative", "homebody"], occasions: ["new-baby"], badge: "editors-pick", searchQuery: "baby first year memory keepsake book" },

  // Food & Drink
  { id: "matcha-kit", name: "Ceremonial Matcha Ritual Kit", rationale: "Stone-ground matcha, whisk, and bowl for a slow, calming morning.", price: 58, rating: 4.7, reviews: 1620, niche: "food-drink", personas: ["coffee-lover", "homebody"], occasions: ["birthday", "christmas", "housewarming"], badge: "editors-pick", editorial: true, searchQuery: "ceremonial matcha whisk bowl gift kit" },
  { id: "barista-grinder", name: "BaristaPro Conical Burr Coffee Grinder", rationale: "40 settings from espresso to cold brew — a daily ritual, upgraded.", price: 149, rating: 4.7, reviews: 2210, niche: "food-drink", personas: ["coffee-lover"], occasions: ["housewarming", "christmas", "anniversary"], badge: "top-rated", editorial: true, searchQuery: "stainless steel conical burr coffee grinder" },
  { id: "moka-pot", name: "Stovetop Espresso Moka Pot 6-cup", rationale: "Rich stovetop espresso with zero pods and zero fuss.", price: 42, rating: 4.5, reviews: 3320, niche: "food-drink", personas: ["coffee-lover"], occasions: ["housewarming", "birthday"], editorial: true, searchQuery: "stovetop espresso moka pot aluminum" },
  { id: "truffle-box", name: "Single-Origin Chocolate Truffle Box", rationale: "A little box of edible luxury that never, ever misses.", price: 38, rating: 4.8, reviews: 4210, niche: "food-drink", personas: ["homebody"], occasions: ["anniversary", "christmas", "birthday"], editorial: true, searchQuery: "single origin chocolate truffle gift box" },
  { id: "hotsauce-flight", name: "Small-Batch Hot Sauce Tasting Flight", rationale: "Five bold small-batch heats for the friend who dares everything.", price: 30, rating: 4.6, reviews: 2410, niche: "food-drink", personas: ["homebody"], occasions: ["birthday", "christmas"], badge: "most-gifted", searchQuery: "hot sauce gift set tasting flight" },
  { id: "whiskey-stones", name: "Chilling Whiskey Stones & Glass Set", rationale: "Chills without watering down — a handsome nightcap upgrade.", price: 45, rating: 4.5, reviews: 3890, niche: "food-drink", personas: ["homebody"], occasions: ["anniversary", "graduation", "christmas"], searchQuery: "whiskey stones glasses gift set" },

  // Outdoors
  { id: "summit-daypack", name: "Summit 22L Weatherproof Daypack", rationale: "Light and water-shedding with a padded laptop and hydration sleeve.", price: 89, rating: 4.7, reviews: 1560, niche: "outdoors", personas: ["traveler", "fitness-person"], occasions: ["birthday", "graduation"], editorial: true, searchQuery: "weatherproof hiking daypack 22l" },
  { id: "skyrest-hammock", name: "Skyrest Packable Double Hammock", rationale: "A two-person nap spot that stuffs down to the size of a grapefruit.", price: 46, rating: 4.7, reviews: 5310, niche: "outdoors", personas: ["traveler", "homebody"], occasions: ["birthday", "graduation"], badge: "most-gifted", editorial: true, searchQuery: "packable camping hammock double" },
  { id: "trail-stove", name: "TrailGear Ultralight Camp Stove Kit", rationale: "Boils in 90 seconds and folds down to palm size.", price: 64, rating: 4.7, reviews: 1180, niche: "outdoors", personas: ["traveler", "fitness-person"], occasions: ["birthday", "christmas"], searchQuery: "ultralight backpacking camp stove kit" },
  { id: "nomad-lantern", name: "Nomad Collapsible Solar Lantern", rationale: "Folds flat, charges in the sun, glows for nights on end.", price: 29, rating: 4.6, reviews: 2640, niche: "outdoors", personas: ["traveler"], occasions: ["birthday", "housewarming"], badge: "editors-pick", searchQuery: "collapsible solar camping lantern" },

  // Pets
  { id: "cloud-pet-bed", name: "Cloud Orthopedic Pet Bed", rationale: "A washable, joint-supporting cloud their best friend will never leave.", price: 59, rating: 4.7, reviews: 8210, niche: "pets", personas: ["homebody"], occasions: ["housewarming", "christmas", "birthday"], badge: "most-gifted", editorial: true, searchQuery: "orthopedic dog bed washable" },
  { id: "forage-puzzle", name: "Forage Interactive Treat Puzzle", rationale: "Turns snack time into a happy, brain-busy game.", price: 26, rating: 4.5, reviews: 4120, niche: "pets", personas: ["homebody"], occasions: ["birthday", "christmas"], searchQuery: "interactive dog treat puzzle toy" },
  { id: "pet-portrait", name: "Custom Hand-Illustrated Pet Portrait", rationale: "A one-of-a-kind keepsake of the four-legged family member.", price: 65, rating: 4.9, reviews: 1870, niche: "pets", personas: ["creative", "homebody"], occasions: ["birthday", "christmas", "anniversary"], badge: "editors-pick", searchQuery: "custom pet portrait illustration" },

  // Experiences
  { id: "tasting-tour", name: "City Tasting-Tour Experience for Two", rationale: "A guided afternoon of local food and stories — make a memory, not clutter.", price: 140, rating: 4.9, reviews: 760, niche: "experiences", personas: ["traveler", "homebody"], occasions: ["anniversary", "birthday"], badge: "editors-pick", editorial: true, searchQuery: "food tasting walking tour experience for two" },
  { id: "pottery-class", name: "Hands-On Pottery Wheel Class for Two", rationale: "Muddy hands, a lot of laughing, and something to keep.", price: 110, rating: 4.8, reviews: 920, niche: "experiences", personas: ["creative", "homebody"], occasions: ["anniversary", "birthday", "housewarming"], badge: "most-gifted", editorial: true, searchQuery: "pottery wheel class experience for two" },
  { id: "stargazing-night", name: "Guided Stargazing Night Experience", rationale: "Telescopes, constellations, and a story about the sky worth remembering.", price: 95, rating: 4.8, reviews: 540, niche: "experiences", personas: ["traveler", "creative"], occasions: ["anniversary", "birthday"], searchQuery: "guided stargazing astronomy experience" },
  { id: "livemusic-box", name: "Live-Music Experience Gift Box", rationale: "Redeemable for a night out at a show of their choosing.", price: 80, rating: 4.6, reviews: 610, niche: "experiences", personas: ["creative", "gamer"], occasions: ["birthday", "graduation"], searchQuery: "live music concert experience gift box" },

  // Splurge (the "they'd never buy it themselves" tier)
  { id: "aerolux-headphones", name: "AeroLux Wireless Noise-Cancelling Headphones", rationale: "Studio-grade silence and 40-hour battery — the splurge they secretly want.", price: 299, rating: 4.8, reviews: 5678, niche: "electronics", personas: ["traveler", "homebody", "creative", "gamer"], occasions: ["birthday", "christmas", "graduation"], badge: "top-rated", searchQuery: "premium wireless noise cancelling over-ear headphones" },
  { id: "artisan-espresso", name: "Artisan Semi-Automatic Espresso Machine", rationale: "Café-quality shots at home — a daily ritual worth the splurge.", price: 349, rating: 4.7, reviews: 3120, niche: "food-drink", personas: ["coffee-lover", "homebody"], occasions: ["housewarming", "anniversary", "christmas"], badge: "top-rated", searchQuery: "semi automatic espresso machine home barista" },
  { id: "weekend-escape", name: "Weekend Escape Boutique-Hotel Stay for Two", rationale: "A whole memory in a box — the anniversary gift that beats any object.", price: 260, rating: 4.9, reviews: 480, niche: "experiences", personas: ["traveler", "homebody"], occasions: ["anniversary", "birthday"], badge: "editors-pick", searchQuery: "boutique hotel weekend getaway experience for two" },

  // ── Expanded catalog ──────────────────────────────────────────────
  // Electronics
  { id: "ember-smart-mug", name: "Temperature-Control Smart Mug", rationale: "Keeps their coffee at the perfect sip from first pour to last.", price: 99, rating: 4.6, reviews: 9840, niche: "electronics", personas: ["coffee-lover", "homebody"], occasions: ["birthday", "christmas"], badge: "most-gifted", editorial: true, searchQuery: "temperature control smart heated coffee mug" },
  { id: "usb-condenser-mic", name: "USB Condenser Streaming Microphone", rationale: "Studio-clear voice for calls, streams, and podcasts in one plug.", price: 69, rating: 4.7, reviews: 6210, niche: "electronics", personas: ["gamer", "creative"], occasions: ["birthday", "graduation"], editorial: true, searchQuery: "usb condenser streaming microphone" },
  { id: "eink-writing-tablet", name: "E-Ink Digital Writing Tablet", rationale: "Paper-like notes and sketches that never need a single sheet.", price: 179, rating: 4.6, reviews: 3410, niche: "electronics", personas: ["creative", "bookworm"], occasions: ["birthday", "graduation", "christmas"], editorial: true, searchQuery: "e-ink digital notebook writing tablet" },
  { id: "portable-monitor-15", name: "15-Inch Portable USB-C Monitor", rationale: "A second screen that folds into a laptop bag — instant productivity.", price: 129, rating: 4.5, reviews: 4120, niche: "electronics", personas: ["gamer", "traveler", "creative"], occasions: ["birthday", "graduation"], searchQuery: "15 inch portable usb-c monitor" },
  { id: "wireless-charge-stand", name: "3-in-1 Wireless Charging Stand", rationale: "Phone, watch, and earbuds all topped up on one tidy nightstand.", price: 45, rating: 4.5, reviews: 5230, niche: "electronics", personas: ["homebody", "traveler"], occasions: ["birthday", "housewarming"], editorial: true, searchQuery: "3 in 1 wireless charging station stand" },
  { id: "mini-projector-hd", name: "Portable HD Mini Projector", rationale: "Turns any wall into movie night — dorm, patio, or bedroom ceiling.", price: 99, rating: 4.4, reviews: 6720, niche: "electronics", personas: ["homebody", "gamer"], occasions: ["birthday", "christmas", "housewarming"], editorial: true, searchQuery: "portable mini hd projector" },
  { id: "smart-plug-4pack", name: "Smart Plug 4-Pack", rationale: "Voice-control any lamp or fan — the easiest smart-home starter.", price: 28, rating: 4.6, reviews: 11200, niche: "electronics", personas: ["homebody"], occasions: ["housewarming", "christmas"], searchQuery: "smart wifi plug 4 pack alexa" },
  { id: "item-tracker-4pack", name: "Bluetooth Item Tracker 4-Pack", rationale: "Never lose keys, wallet, or bag again — a small daily relief.", price: 60, rating: 4.7, reviews: 8830, niche: "electronics", personas: ["traveler", "homebody"], occasions: ["birthday", "christmas"], editorial: true, searchQuery: "bluetooth item tracker tag 4 pack" },
  { id: "standalone-vr", name: "Standalone VR Headset", rationale: "Full-immersion gaming and fitness with no PC or wires needed.", price: 299, rating: 4.6, reviews: 7410, niche: "electronics", personas: ["gamer"], occasions: ["birthday", "christmas", "graduation"], badge: "top-rated", searchQuery: "standalone vr headset" },

  // Fitness
  { id: "adjustable-dumbbells", name: "Adjustable Dumbbell Pair", rationale: "A whole rack of weights in one dial — a home gym that fits a shelf.", price: 199, rating: 4.7, reviews: 5620, niche: "fitness", personas: ["fitness-person"], occasions: ["birthday", "christmas"], badge: "most-gifted", editorial: true, searchQuery: "adjustable dumbbell set pair" },
  { id: "vibrating-foam-roller", name: "Vibrating Foam Roller", rationale: "Rolls out sore legs with four speeds of relief after any session.", price: 79, rating: 4.6, reviews: 2980, niche: "fitness", personas: ["fitness-person"], occasions: ["christmas", "birthday"], editorial: true, searchQuery: "vibrating foam roller muscle recovery" },
  { id: "smart-jump-rope", name: "Weighted Smart Jump Rope", rationale: "Counts every jump and torches calories — cardio that packs away.", price: 30, rating: 4.5, reviews: 4310, niche: "fitness", personas: ["fitness-person"], occasions: ["birthday", "graduation"], searchQuery: "weighted smart jump rope counter" },
  { id: "infrared-sauna-blanket", name: "Infrared Sauna Blanket", rationale: "A detox-sweat spa session that unrolls in their own living room.", price: 199, rating: 4.5, reviews: 1890, niche: "fitness", personas: ["fitness-person", "homebody"], occasions: ["christmas", "anniversary"], badge: "editors-pick", searchQuery: "infrared sauna blanket at home" },
  { id: "running-belt", name: "Slim Running Belt", rationale: "Holds phone, keys, and cards without a single bounce on a run.", price: 22, rating: 4.5, reviews: 6120, niche: "fitness", personas: ["fitness-person", "traveler"], occasions: ["birthday"], searchQuery: "running belt phone holder" },

  // Home & Kitchen
  { id: "burr-coffee-grinder", name: "Conical Burr Coffee Grinder", rationale: "Fresh, even grounds that make every cup taste like a café.", price: 99, rating: 4.6, reviews: 5210, niche: "home-kitchen", personas: ["coffee-lover", "homebody"], occasions: ["housewarming", "christmas"], editorial: true, searchQuery: "conical burr coffee grinder electric" },
  { id: "chef-knife-set", name: "Japanese Chef Knife Set", rationale: "Razor-sharp blades that make cooking feel effortless and fun.", price: 120, rating: 4.7, reviews: 3860, niche: "home-kitchen", personas: ["homebody"], occasions: ["housewarming", "anniversary", "christmas"], badge: "top-rated", editorial: true, searchQuery: "japanese chef knife set" },
  { id: "air-fryer-xl", name: "XL Digital Air Fryer", rationale: "Crispy dinners in minutes — the countertop hero everyone gifts.", price: 89, rating: 4.7, reviews: 14100, niche: "home-kitchen", personas: ["homebody"], occasions: ["housewarming", "christmas", "birthday"], badge: "most-gifted", editorial: true, searchQuery: "xl digital air fryer" },
  { id: "weighted-blanket", name: "Cooling Weighted Blanket", rationale: "A calming hug that helps them sleep deeper on the hardest days.", price: 69, rating: 4.6, reviews: 12800, niche: "home-kitchen", personas: ["homebody"], occasions: ["birthday", "christmas"], badge: "most-gifted", editorial: true, searchQuery: "cooling weighted blanket 15 lbs" },
  { id: "robot-vacuum", name: "Self-Emptying Robot Vacuum", rationale: "Hands-off clean floors every day — the gift of found time.", price: 249, rating: 4.6, reviews: 9240, niche: "home-kitchen", personas: ["homebody"], occasions: ["housewarming", "christmas"], badge: "top-rated", searchQuery: "self emptying robot vacuum" },
  { id: "essential-oil-diffuser", name: "Ceramic Essential Oil Diffuser", rationale: "Turns any room into a calm, great-smelling retreat.", price: 32, rating: 4.5, reviews: 7630, niche: "home-kitchen", personas: ["homebody"], occasions: ["housewarming", "birthday"], editorial: true, searchQuery: "ceramic essential oil diffuser" },
  { id: "linen-sheet-set", name: "Stonewashed Linen Sheet Set", rationale: "Breathable, gets-softer-forever sheets — an everyday luxury.", price: 150, rating: 4.7, reviews: 2410, niche: "home-kitchen", personas: ["homebody"], occasions: ["housewarming", "anniversary"], editorial: true, searchQuery: "stonewashed linen sheet set" },
  { id: "cast-iron-skillet", name: "Pre-Seasoned Cast Iron Skillet", rationale: "A lifetime pan that sears, bakes, and only gets better with age.", price: 30, rating: 4.8, reviews: 22400, niche: "home-kitchen", personas: ["homebody"], occasions: ["housewarming", "christmas"], editorial: true, searchQuery: "pre seasoned cast iron skillet" },

  // Beauty
  { id: "silk-pillowcase", name: "Mulberry Silk Pillowcase", rationale: "Kinder to skin and hair — a tiny nightly upgrade they'll adore.", price: 45, rating: 4.6, reviews: 9120, niche: "beauty", personas: ["homebody"], occasions: ["birthday", "christmas", "anniversary"], badge: "most-gifted", editorial: true, searchQuery: "mulberry silk pillowcase" },
  { id: "gua-sha-set", name: "Gua Sha & Roller Set", rationale: "A two-minute spa ritual for de-puffing and unwinding.", price: 24, rating: 4.5, reviews: 6340, niche: "beauty", personas: ["homebody", "creative"], occasions: ["birthday"], editorial: true, searchQuery: "gua sha facial roller set" },
  { id: "led-face-mask", name: "LED Light Therapy Mask", rationale: "At-home glow tech that turns skincare into a nightly treat.", price: 199, rating: 4.4, reviews: 3110, niche: "beauty", personas: ["homebody"], occasions: ["birthday", "christmas"], badge: "editors-pick", searchQuery: "led light therapy face mask" },
  { id: "spa-gift-set", name: "Luxury Bath & Body Gift Set", rationale: "A ready-to-unwrap spa day — always a safe, lovely bet.", price: 48, rating: 4.5, reviews: 8210, niche: "beauty", personas: ["homebody"], occasions: ["birthday", "christmas"], editorial: true, searchQuery: "luxury bath body spa gift set" },
  { id: "fragrance-discovery", name: "Designer Fragrance Discovery Set", rationale: "Eight tiny bottles to find their signature scent, no guessing.", price: 35, rating: 4.4, reviews: 2980, niche: "beauty", personas: ["creative"], occasions: ["birthday", "anniversary"], searchQuery: "designer fragrance discovery sampler set" },

  // Fashion
  { id: "pure-cashmere-scarf", name: "Pure Cashmere Scarf", rationale: "Impossibly soft warmth — an elegant gift that never misses.", price: 80, rating: 4.7, reviews: 3420, niche: "fashion", personas: ["homebody", "traveler"], occasions: ["birthday", "christmas", "anniversary"], editorial: true, searchQuery: "pure cashmere scarf" },
  { id: "slim-leather-wallet", name: "Slim RFID Leather Wallet", rationale: "Full-grain leather that ages beautifully — a daily-carry upgrade.", price: 45, rating: 4.6, reviews: 10600, niche: "fashion", personas: ["traveler"], occasions: ["birthday", "graduation", "christmas"], badge: "most-gifted", editorial: true, searchQuery: "slim rfid leather wallet men" },
  { id: "merino-sock-set", name: "Merino Wool Sock Set", rationale: "Cozy, odor-resistant socks they'll reach for all winter long.", price: 35, rating: 4.6, reviews: 5410, niche: "fashion", personas: ["homebody", "fitness-person"], occasions: ["christmas", "birthday"], editorial: true, searchQuery: "merino wool socks gift set" },
  { id: "leather-crossbody", name: "Leather Crossbody Bag", rationale: "Just-right size, hands-free ease — a go-everywhere favorite.", price: 120, rating: 4.6, reviews: 2870, niche: "fashion", personas: ["traveler", "creative"], occasions: ["birthday", "anniversary"], searchQuery: "leather crossbody bag" },
  { id: "polarized-sunglasses", name: "Polarized Classic Sunglasses", rationale: "Glare-free, timeless frames that suit almost anyone.", price: 65, rating: 4.5, reviews: 6120, niche: "fashion", personas: ["traveler"], occasions: ["birthday", "graduation"], editorial: true, searchQuery: "polarized sunglasses classic" },
  { id: "minimalist-watch", name: "Minimalist Automatic Watch", rationale: "A clean, self-winding watch that reads as quietly expensive.", price: 180, rating: 4.6, reviews: 1940, niche: "fashion", personas: ["creative", "traveler"], occasions: ["graduation", "anniversary", "birthday"], searchQuery: "minimalist automatic watch" },

  // Books
  { id: "bestseller-cookbook", name: "Bestselling Everyday Cookbook", rationale: "Weeknight recipes that actually get made — a kitchen staple.", price: 30, rating: 4.8, reviews: 18700, niche: "books", personas: ["homebody", "coffee-lover"], occasions: ["housewarming", "christmas", "birthday"], editorial: true, searchQuery: "bestselling everyday cookbook" },
  { id: "book-box-subscription", name: "Monthly Book Box Subscription", rationale: "A hand-picked read plus goodies at their door every month.", price: 45, rating: 4.5, reviews: 2210, niche: "books", personas: ["bookworm"], occasions: ["birthday", "christmas"], editorial: true, searchQuery: "monthly book subscription box" },
  { id: "gratitude-journal", name: "Guided Gratitude Journal", rationale: "Five calm minutes a day — a gently life-improving habit.", price: 22, rating: 4.7, reviews: 9240, niche: "books", personas: ["bookworm", "creative"], occasions: ["birthday", "graduation"], badge: "most-gifted", editorial: true, searchQuery: "guided gratitude journal" },
  { id: "clothbound-classics", name: "Clothbound Classics Box Set", rationale: "Beautiful shelf-worthy editions of the books they love.", price: 90, rating: 4.8, reviews: 1620, niche: "books", personas: ["bookworm"], occasions: ["birthday", "christmas", "graduation"], badge: "editors-pick", searchQuery: "clothbound classics hardcover box set" },
  { id: "rechargeable-book-light", name: "Rechargeable Clip Book Light", rationale: "Warm, eye-friendly light for late chapters without waking anyone.", price: 20, rating: 4.6, reviews: 7810, niche: "books", personas: ["bookworm"], occasions: ["birthday", "christmas"], editorial: true, searchQuery: "rechargeable clip on book reading light" },

  // Food & Drink
  { id: "whiskey-stones-set", name: "Whiskey Stones & Glass Set", rationale: "Chills their pour without watering it down — a handsome ritual.", price: 40, rating: 4.6, reviews: 5230, niche: "food-drink", personas: ["homebody"], occasions: ["birthday", "anniversary", "christmas"], editorial: true, searchQuery: "whiskey stones glass gift set" },
  { id: "hot-sauce-sampler", name: "Artisan Hot Sauce Sampler", rationale: "A tour of small-batch heat for the one who sauces everything.", price: 30, rating: 4.6, reviews: 4120, niche: "food-drink", personas: ["homebody"], occasions: ["birthday", "christmas"], editorial: true, searchQuery: "artisan hot sauce gift set sampler" },
  { id: "tea-sampler", name: "Loose-Leaf Tea Sampler", rationale: "A cabinet of calm — a dozen teas to slow the day down.", price: 35, rating: 4.5, reviews: 3980, niche: "food-drink", personas: ["coffee-lover", "homebody"], occasions: ["birthday", "christmas", "get-well"], editorial: true, searchQuery: "loose leaf tea sampler gift set" },
  { id: "gourmet-chocolate-box", name: "Gourmet Chocolate Assortment", rationale: "A beautiful box of small-batch chocolate — universally adored.", price: 40, rating: 4.7, reviews: 9820, niche: "food-drink", personas: ["homebody"], occasions: ["birthday", "anniversary", "christmas"], badge: "most-gifted", editorial: true, searchQuery: "gourmet chocolate assortment gift box" },
  { id: "coffee-subscription", name: "Specialty Coffee Subscription", rationale: "Fresh single-origin beans at their door — a daily upgrade.", price: 50, rating: 4.7, reviews: 3110, niche: "food-drink", personas: ["coffee-lover"], occasions: ["birthday", "christmas"], badge: "top-rated", editorial: true, searchQuery: "specialty coffee bean subscription" },
  { id: "acacia-cheese-board", name: "Acacia Cheese Board Set", rationale: "Instant host mode — a board and tools for easy gatherings.", price: 55, rating: 4.7, reviews: 6420, niche: "food-drink", personas: ["homebody"], occasions: ["housewarming", "anniversary", "christmas"], editorial: true, searchQuery: "acacia wood cheese board knife set" },
  { id: "pour-over-kit", name: "Pour-Over Coffee Starter Kit", rationale: "Everything for a slow, delicious morning brew in one box.", price: 45, rating: 4.6, reviews: 2740, niche: "food-drink", personas: ["coffee-lover"], occasions: ["housewarming", "birthday"], editorial: true, searchQuery: "pour over coffee maker starter kit" },

  // Outdoors
  { id: "camp-hammock", name: "Double Camping Hammock", rationale: "A featherweight nap spot that packs into a jacket pocket.", price: 40, rating: 4.7, reviews: 8210, niche: "outdoors", personas: ["traveler", "fitness-person"], occasions: ["birthday", "graduation"], editorial: true, searchQuery: "double camping hammock lightweight" },
  { id: "cooler-backpack", name: "Insulated Cooler Backpack", rationale: "Keeps drinks cold hands-free — hikes, beaches, and tailgates.", price: 60, rating: 4.6, reviews: 5120, niche: "outdoors", personas: ["traveler", "fitness-person"], occasions: ["birthday", "christmas"], searchQuery: "insulated cooler backpack" },
  { id: "waterproof-picnic-blanket", name: "Waterproof Picnic Blanket", rationale: "A big, cozy, wipe-clean base for parks and open-air everything.", price: 35, rating: 4.6, reviews: 6730, niche: "outdoors", personas: ["traveler", "homebody"], occasions: ["housewarming", "birthday"], editorial: true, searchQuery: "waterproof outdoor picnic blanket" },
  { id: "rechargeable-headlamp", name: "Rechargeable LED Headlamp", rationale: "Hands-free light for trails, campsites, and every power outage.", price: 30, rating: 4.6, reviews: 9110, niche: "outdoors", personas: ["traveler"], occasions: ["birthday", "christmas"], editorial: true, searchQuery: "rechargeable led headlamp" },
  { id: "smokeless-fire-pit", name: "Smokeless Portable Fire Pit", rationale: "Backyard bonfires without the smoke chase — instant good nights.", price: 199, rating: 4.7, reviews: 4310, niche: "outdoors", personas: ["traveler", "homebody"], occasions: ["housewarming", "christmas"], badge: "editors-pick", searchQuery: "smokeless portable fire pit" },

  // Pets
  { id: "treat-pet-camera", name: "Treat-Tossing Pet Camera", rationale: "Check in and toss a snack from anywhere — for the pet parent.", price: 99, rating: 4.5, reviews: 6210, niche: "pets", personas: ["homebody"], occasions: ["birthday", "christmas"], editorial: true, searchQuery: "treat tossing pet camera dog" },
  { id: "orthopedic-dog-bed", name: "Orthopedic Memory-Foam Dog Bed", rationale: "Joint-friendly comfort that older pups (and their people) love.", price: 70, rating: 4.7, reviews: 8410, niche: "pets", personas: ["homebody"], occasions: ["birthday", "christmas"], badge: "most-gifted", editorial: true, searchQuery: "orthopedic memory foam dog bed" },
  { id: "auto-pet-feeder", name: "Automatic Pet Feeder", rationale: "Portioned meals on schedule — peace of mind for busy days.", price: 65, rating: 4.5, reviews: 5320, niche: "pets", personas: ["homebody"], occasions: ["housewarming", "birthday"], searchQuery: "automatic pet feeder timed" },
  { id: "gps-pet-collar", name: "GPS Pet Tracker Collar", rationale: "Live location for the escape artist — real reassurance.", price: 99, rating: 4.4, reviews: 4110, niche: "pets", personas: ["traveler", "homebody"], occasions: ["birthday", "christmas"], editorial: true, searchQuery: "gps pet tracker collar dog" },

  // Experiences
  { id: "online-cooking-class", name: "Online Cooking Class Membership", rationale: "Chef-led classes from their kitchen — a year of tasty date nights.", price: 70, rating: 4.6, reviews: 1520, niche: "experiences", personas: ["homebody", "coffee-lover"], occasions: ["anniversary", "birthday"], editorial: true, searchQuery: "online cooking class membership gift" },
  { id: "beginner-telescope", name: "Beginner Astronomy Telescope", rationale: "Rings of Saturn from the backyard — wonder they'll never forget.", price: 120, rating: 4.5, reviews: 3210, niche: "experiences", personas: ["bookworm", "traveler"], occasions: ["birthday", "graduation", "christmas"], searchQuery: "beginner astronomy telescope" },
  { id: "pottery-wheel-kit", name: "At-Home Pottery Wheel Kit", rationale: "A hands-on, screen-free hobby that makes keepsakes from mud.", price: 90, rating: 4.4, reviews: 2110, niche: "experiences", personas: ["creative"], occasions: ["birthday", "christmas"], editorial: true, searchQuery: "at home pottery wheel kit beginner" },
  { id: "wine-tasting-kit", name: "Guided Wine Tasting Kit", rationale: "A structured, fun tasting night in a box — no sommelier needed.", price: 75, rating: 4.5, reviews: 1340, niche: "experiences", personas: ["homebody"], occasions: ["anniversary", "birthday"], editorial: true, searchQuery: "guided wine tasting kit gift" },
  { id: "spa-day-voucher", name: "Spa Day Experience Voucher", rationale: "A full day of pampering they'd never book for themselves.", price: 150, rating: 4.7, reviews: 620, niche: "experiences", personas: ["homebody"], occasions: ["birthday", "anniversary"], badge: "editors-pick", searchQuery: "spa day experience gift voucher" },
];

// ── Helpers ─────────────────────────────────────────────────────────

export function priceRangeOf(price: number): PriceRange {
  return PRICE_RANGES.find((r) => price >= r.min && price < r.max) ?? PRICE_RANGES[PRICE_RANGES.length - 1];
}

function inSelectedPrice(price: number, selected: string[]): boolean {
  if (selected.length === 0) return true;
  return selected.some((v) => {
    const r = PRICE_RANGES.find((x) => x.value === v);
    return r ? price >= r.min && price < r.max : false;
  });
}

export type DiscoverFilters = {
  occasions: string[];
  personas: string[];
  priceRanges: string[];
  niches: string[];
};

/** Apply all four independent layers (AND across layers, OR within a layer). */
export function filterDiscover(products: DiscoverProduct[], f: DiscoverFilters): DiscoverProduct[] {
  return products.filter((p) => {
    if (f.occasions.length && !f.occasions.some((o) => p.occasions.includes(o))) return false;
    if (f.personas.length && !f.personas.some((x) => p.personas.includes(x))) return false;
    if (f.niches.length && !f.niches.includes(p.niche)) return false;
    if (!inSelectedPrice(p.price, f.priceRanges)) return false;
    return true;
  });
}

/** The default feed: a mixed editorial selection of the most giftable picks. */
export function editorialFeed(products = DISCOVER_PRODUCTS): DiscoverProduct[] {
  return [...products]
    .filter((p) => p.editorial)
    .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
}

// Map a saved profile's interest tags (from constants.INTEREST_TAGS) to the
// discover personas, so "Based on your people" can match real personalities.
const INTEREST_TO_PERSONAS: Record<string, string[]> = {
  coffee: ["coffee-lover"],
  cooking: ["homebody"],
  baking: ["homebody"],
  wine: ["homebody"],
  foodie: ["homebody"],
  home: ["homebody"],
  selfcare: ["homebody"],
  gardening: ["homebody"],
  fitness: ["fitness-person"],
  running: ["fitness-person"],
  yoga: ["fitness-person"],
  sports: ["fitness-person"],
  travel: ["traveler"],
  camping: ["traveler"],
  outdoors: ["traveler"],
  reading: ["bookworm"],
  writing: ["bookworm", "creative"],
  gaming: ["gamer"],
  tech: ["gamer"],
  music: ["creative"],
  instruments: ["creative"],
  art: ["creative"],
  crafts: ["creative"],
  photography: ["creative"],
  fashion: ["creative"],
  beauty: ["homebody"],
  movies: ["homebody"],
  pets: ["homebody"],
};

/** Does this product suit a person with these personas / upcoming occasions? */
export function matchesPerson(product: DiscoverProduct, personas: string[], occasions: string[]): boolean {
  return personas.some((x) => product.personas.includes(x)) || occasions.some((o) => product.occasions.includes(o));
}

export function personasFromInterests(interests: string[]): string[] {
  const out = new Set<string>();
  for (const tag of interests) {
    for (const persona of INTEREST_TO_PERSONAS[tag] ?? []) out.add(persona);
  }
  return [...out];
}

export function labelForOption(options: OptionDef[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

/**
 * Best products for one person, scored by how well they match the person's
 * personas (from their interests) and upcoming occasion types. Used to build
 * the subtle "Based on your people" row.
 */
export function matchesForPerson(
  personas: string[],
  occasions: string[],
  limit = 2,
): { product: DiscoverProduct; matchedOccasion?: string; matchedPersona?: string }[] {
  const scored = DISCOVER_PRODUCTS.map((product) => {
    const matchedPersona = personas.find((x) => product.personas.includes(x));
    const matchedOccasion = occasions.find((o) => product.occasions.includes(o));
    let score = 0;
    if (matchedPersona) score += 2;
    if (matchedOccasion) score += 2;
    // Nudge broadly-loved picks up as a tiebreaker.
    if (product.editorial) score += 0.5;
    score += Math.min(product.reviews / 20000, 0.9);
    return { product, matchedOccasion, matchedPersona, score };
  })
    .filter((s) => s.matchedPersona || s.matchedOccasion)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ product, matchedOccasion, matchedPersona }) => ({
    product,
    matchedOccasion,
    matchedPersona,
  }));
}
