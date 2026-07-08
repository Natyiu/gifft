# GiftMind

This file provides context about the project for AI assistants.

## Project Overview

GiftMind is an AI-powered gift recommendation engine built on the Batman
boilerplate. You describe a person — personality, interests, life context, your
relationship — and GiftMind generates hyper-specific, genuinely thoughtful gift
ideas with the reasoning behind each one (plus a cheaper/premium alternative and
a personal-touch suggestion).

- **Ecosystem**: Typescript

### GiftMind specifics

- **AI engine**: `apps/web/src/lib/giftmind/engine.ts` — generates the gift
  ideas with the Vercel AI SDK (`ai`) + Gemini 2.5 Flash (`@ai-sdk/google`,
  `gemini-2.5-flash`) via `generateObject` against a Zod schema. Reads
  `GOOGLE_GENERATIVE_AI_API_KEY`; if unset it falls back to a personalized
  sample generator so the app works end-to-end without a key.
- **Product finder**: `apps/web/src/lib/giftmind/product-finder.ts` — for each
  idea, uses the Firecrawl REST API (`FIRECRAWL_API_KEY`) to find a real,
  buyable product on the web (Amazon first for affiliate commission, then Etsy
  /other merchants), scrape its image + price, and return a clickable buy URL.
  Amazon links get the `AMAZON_ASSOCIATE_TAG`. Best-effort: any failure falls
  back to a tagged Amazon search link. `GiftIdea.imageUrl`/`productSource` store
  the result — run `pnpm db:push` after pulling this in.
  - **Gift cards are image-free.** To avoid the cost/unreliability of scraping
    Amazon product photos, `runGeneration` calls `findProducts` with
    `skipImages: true` — it scrapes **price + buy link only** (faster/cheaper,
    no image-search step). `gift-card.tsx` and `gift-detail-view.tsx` render no
    image box — just the AI text, price, and buy link. Scraping still happens
    **up front** during generation, and `/start/reveal` covers that time with a
    ~5s 3D gift-launch animation (`index.css` `gift-spiral`/`gift-jump`/
    `gift-spin`), routing to results only once generation resolves. NOTE: the
    Discover feed is unrelated and still shows real scraped photos via
    `resolveDiscoverMedia` (no `skipImages`). `GiftIdea.imageUrl`/`imageUrls`
    columns remain but are stored empty for the gift flow. To reinstate photos,
    drop `skipImages` and restore the image box.
- **Server actions**: `apps/web/src/lib/actions/giftmind.ts` (profiles,
  occasions, generation, vault, wishlist sharing, plan entitlements).
- **Payments & entitlements**: any number of Polar plans are supported. The
  `/pricing` page renders all live Polar products dynamically. Access is granted
  two ways, unified by `getEntitlements` (`actions/giftmind.ts`): an **active
  recurring subscription** (`lib/subscription.ts` → `Subscription` table) gives
  unlimited searches, while **one-time purchases** grant a consumable pool of
  **search credits** (`lib/credits.ts` → `GiftCredit` table, keyed by unique
  `polarOrderId`; a one-time order grants 1 credit, or `metadata.credits` for a
  multi-search pack). `runGeneration` spends one credit per completed search for
  credit-based users (never for subscribers) and only after a successful run.
  The webhook (`app/api/webhooks/polar/route.ts`) handles `subscription.*`
  (upsert subscription) and `order.*` (grant/revoke credits) events. Because the
  webhook can be slow/misconfigured, `syncPolarEntitlement` (`actions/polar.ts`)
  reconciles entitlement **directly against the Polar API** (matching the
  customer by the `externalCustomerId` = user id set at checkout, or by email) and
  writes it into the DB; the reveal page calls it and retries once before showing
  the paywall (plus an "Already paid? Check again" button). Gating uses a returned
  `{ paymentRequired: true }` value — never a thrown error, which Vercel masks into
  an opaque 500. The credits layer (`lib/credits.ts`) degrades gracefully if its
  table is missing. Run `pnpm db:push` after pulling this in (needed for the
  one-time-credit path; subscriptions work without it).
- **Data fetching / caching**: sidebar dashboard pages use **TanStack Query**
  for instant re-navigation. Each page's read logic lives in a loader server
  action in `apps/web/src/lib/loaders/*.ts` (`getPlannerData`, `getDiscoverData`,
  `getCalendarData`, `getVaultData`, `getWishlistData`). The `page.tsx` is a thin
  server component that `prefetchQuery`s the loader and wraps a client
  `*-page-view` in a `HydrationBoundary` (SSR-fast first paint + client cache).
  The view calls `useQuery({ queryKey: ["<page>"], queryFn: () => loader() })`
  and renders the existing client UI (or a skeleton). Provider +
  config: `components/query-provider.tsx` + `lib/query-client.ts` (staleTime 60s,
  shared browser client). NOTE: the People grid and Dashboard home still fetch in
  their server components (not yet on Query). Mutations use local optimistic
  state; add `queryClient.invalidateQueries` if you need cross-page refresh.
- **Domain models**: `packages/db/prisma/schema/giftmind.prisma`
  (PersonProfile, Occasion, GenerationRun, GiftIdea, GiftVaultEntry,
  WishlistShare, GiftGroup, GiftPlan). Plain indexed `userId` scalars — no
  relation into the auth schema. Run `pnpm db:push` (and `pnpm db:generate`)
  after schema changes.
- **Planner** (`/dashboard/planner`): the full gifting year — per-person
  color-coded occasions with countdowns, budget + early-ideas + gift status
  (`Occasion.giftStatus`), previous-years' gifts from the vault, a January
  planning mode, a 30/14/3-day reminder track with a one-click AI "Bring ideas"
  action (`generateIdeasFor`), group-gift cards (`GiftGroup`, keyed by
  `occasionKey`), and an `.ics` device-calendar export (`lib/giftmind/ics.ts`).
  Users also author their own plans via **Add plan** (`GiftPlan`): pick an
  event/season (`lib/giftmind/plan-occasions.ts`), a recipient, group or not, a
  notify date, then Save or Generate-ideas-&-save; the plans list has a
  person/event filter. The calendar (`/dashboard/calendar`) also surfaces
  universal gift-giving holidays via `lib/giftmind/holidays.ts`.
- **Discover**: `/dashboard/discover` — a curated gift *discovery* feed (an
  editorial magazine, not a store; never uses the word "Shop"). Four independent
  filter layers combine (occasion, persona, price range, and a horizontal niche
  pill row); a "Based on your people" row matches saved profiles' personalities
  and upcoming occasions. Static keyless dataset + helpers in
  `apps/web/src/lib/giftmind/discover.ts`; UI in
  `components/giftmind/discover-feed.tsx` + `discover-card.tsx`. Card images are
  **real scraped product photos** (not AI-generated): the client card lazily
  calls `resolveDiscoverMedia` (`lib/actions/discover.ts`) on scroll-into-view,
  which runs the Firecrawl `product-finder` and caches the result in the
  `DiscoverMedia` table (keyed by `searchQuery`) so each product is scraped once.
  Cached rows are preloaded server-side and render instantly; buy-throughs use
  the real scraped product URL when found, else a tagged Amazon search
  (`AMAZON_ASSOCIATE_TAG`). Run `pnpm db:push` after pulling this in.
- **Key routes**: `/` landing, `/pricing`, `/dashboard` (people grid),
  `/dashboard/discover`, `/dashboard/people/new` + `/[id]` + `/[id]/edit`,
  `/dashboard/results/[runId]`, `/dashboard/calendar`, `/dashboard/vault`,
  `/dashboard/planner`, `/dashboard/wishlist`, and public `/wishlist/[token]`.
- **Components**: `apps/web/src/components/giftmind/*`.
- **Theme**: warm green + cream, serif (Fraunces) headings — defined in
  `apps/web/src/index.css` and `layout.tsx`.

## Tech Stack

- **Runtime**: none
- **Package Manager**: pnpm

### Frontend

- Framework: next
- CSS: tailwind
- UI Library: shadcn-ui

### Backend

- Framework: self
- Validation: zod

### Database

- Database: postgres
- ORM: prisma

### Authentication

- Provider: better-auth

### Additional Features

- Testing: vitest
- AI: vercel-ai

## Project Structure

```
Batman/
├── apps/
│   ├── marketing/   # Marketing landing & purchase flow (seller-only, excluded from boilerplate)
│   └── web/         # Frontend application (boilerplate)
├── packages/
│   ├── auth/        # Authentication
│   └── db/          # Database schema
```

## Common Commands

- `pnpm install` - Install dependencies
- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm db:push` - Push database schema
- `pnpm db:studio` - Open database UI

## Maintenance

Keep CLAUDE.md updated when:

- Adding/removing dependencies
- Changing project structure
- Adding new features or services
- Modifying build/dev workflows

AI assistants should suggest updates to this file when they notice relevant changes.
