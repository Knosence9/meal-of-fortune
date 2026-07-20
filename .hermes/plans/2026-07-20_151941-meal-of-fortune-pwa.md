# Meal of Fortune PWA Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build an installable mobile-first web app that turns a group's shared cravings and practical constraints into one qualified nearby restaurant choice, revealed through an accessible wheel-style experience.

**Architecture:** Use a single SvelteKit application for the mobile-first UI, server-side restaurant-provider proxy, pure filtering/scoring/selection domain, web manifest, and service worker. Keep provider credentials server-side, precise location ephemeral, and place-provider code behind an adapter. The domain engine selects the result before animation; the wheel is an honest reveal mechanism, not an opaque or manipulable source of truth.

**Tech Stack:** SvelteKit, Svelte 5, TypeScript, pnpm, Zod, Vitest, Svelte Testing Library, Playwright, SvelteKit service worker, Web App Manifest, `@sveltejs/adapter-vercel`, and a restaurant provider selected by a documented coverage/terms/cost spike.

**Status:** This plan supersedes `/home/knosence/Projects/meal-randomizer/.hermes/plans/2026-07-20_145946-meal-randomizer-mvp.md`.

---

## 1. Product definition

### Working name

**Meal of Fortune**

The name is memorable and communicates food plus chance. Because it deliberately echoes the existing “Wheel of Fortune” entertainment mark, treat it as a working name until a basic name, domain, and trademark review is complete. Do not imitate the television show's logo, letterboard, sounds, typography, colors, host imagery, wheel artwork, or other trade dress.

### Core promise

> “Tell us what sounds good, and we will make the restaurant decision.”

### Confirmed MVP decisions

- Build a responsive progressive web app rather than native Android/iOS applications.
- Make it installable on supported Android and iOS browsers.
- Everyone contributes to one shared craving list on one device.
- Version one chooses a restaurant only.
- Exact dish/menu randomization is deferred.
- Filter first, then randomize within the qualified set.
- Present one decision, not another long restaurant list.
- No account is required for the first useful session.
- No ordering, delivery, reservations, reviews, loyalty system, or social network in version one.

### Recommended MVP defaults

- Request foreground browser location only after explaining why.
- Provide manual location entry when permission is denied or unavailable.
- Start with a 5-mile radius, “open now,” and all price levels.
- Accept both free-text cravings and visible suggestion chips.
- Treat location radius, explicit exclusions, and required cuisine as hard constraints.
- Treat flavor, mood, food form, preferred cuisine, and price as soft signals unless explicitly marked required.
- Use seeded weighted random selection among eligible restaurants.
- Exclude previously revealed restaurants until the current candidate set is exhausted.
- Show two or three reasons explaining the match.
- Warn that restaurant-level data cannot prove menu availability, dietary compliance, or allergen safety.

### Non-goals

- Exact menu items or current dish prices
- Allergen-safe recommendations
- Nutritional calculations
- Multi-device live voting
- Permanent profiles or taste histories
- Sponsored placement disguised as chance
- AI-generated restaurants, reviews, or menu claims
- A ranked “top ten” restaurant browser

## 2. Framework decision

### Recommendation: SvelteKit

The product is dominated by interactive state: location permission, craving entry, constraint editing, network requests, wheel reveal, rerolls, and install/offline behavior. Astro's principal advantage—shipping mostly static HTML with a few isolated interactive islands—would be underused because most of this product would become one large hydrated island.

SvelteKit provides a better center of gravity:

- first-class stateful application routing and components;
- server endpoints in the same project for hiding provider credentials;
- a framework-recognized `src/service-worker` entry that is bundled and registered;
- SSR/prerendering for a fast initial shell without forcing the entire site into SPA-only mode;
- straightforward progressive enhancement and mobile-first interaction;
- less state/UI boilerplate than a React application of similar size.

Astro remains viable if the project later grows into a content-heavy restaurant publication with a small embedded decision tool. That is not the current product.

## 3. First-principles decision pipeline

```text
shared cravings + hard constraints + selected location
                         ↓
             retrieve nearby restaurants
                         ↓
            normalize provider records
                         ↓
           remove ineligible restaurants
                         ↓
      score each eligible restaurant with reasons
                         ↓
        seeded weighted random selection
                         ↓
          animate an honest result reveal
                         ↓
    accept, open maps, reroll, or edit preferences
```

### Starting selection model

```text
weight = 1
       + cuisine_match_points
       + abstract_craving_match_points
       + food_form_match_points
       + price_preference_points
       + bounded_proximity_bonus
```

Hard failures receive no weight. Ratings must not dominate stated cravings. Every coefficient belongs in one configuration object and must be covered by tests.

The selection engine returns the chosen candidate before the visual wheel starts. The animation must land on that predetermined candidate and must respect `prefers-reduced-motion`.

## 4. Proposed repository layout

```text
meal-of-fortune/
├── .github/workflows/ci.yml
├── .hermes/plans/
├── docs/
│   ├── analytics-events.md
│   ├── name-clearance.md
│   ├── product-validation.md
│   └── provider-evaluation.md
├── e2e/
│   ├── decision-flow.spec.ts
│   ├── installability.spec.ts
│   └── location-fallback.spec.ts
├── src/
│   ├── app.d.ts
│   ├── app.html
│   ├── service-worker.ts
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ConstraintControls.svelte
│   │   │   ├── CravingInput.svelte
│   │   │   ├── DecisionWheel.svelte
│   │   │   ├── InstallPrompt.svelte
│   │   │   ├── LocationGate.svelte
│   │   │   └── RestaurantResult.svelte
│   │   ├── domain/
│   │   │   ├── constraints.ts
│   │   │   ├── cravings.ts
│   │   │   ├── explanations.ts
│   │   │   ├── fallbacks.ts
│   │   │   ├── restaurant.ts
│   │   │   ├── scoring.ts
│   │   │   └── selection.ts
│   │   ├── server/
│   │   │   ├── location-privacy.ts
│   │   │   └── providers/
│   │   │       ├── places-provider.ts
│   │   │       └── selected-provider.ts
│   │   ├── state/
│   │   │   └── decision-session.svelte.ts
│   │   └── types/
│   └── routes/
│       ├── +layout.svelte
│       ├── +page.svelte
│       ├── decide/+page.svelte
│       ├── result/+page.svelte
│       └── api/restaurants/+server.ts
├── static/
│   ├── icons/
│   ├── manifest.webmanifest
│   └── robots.txt
├── tests/
│   ├── components/
│   ├── domain/
│   └── server/
├── eslint.config.js
├── package.json
├── playwright.config.ts
├── svelte.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 5. Implementation tasks

### Task 1: Perform name and visual-identity clearance

**Objective:** Determine whether “Meal of Fortune” is safe enough for development, domains, and public distribution without implying affiliation with the television property.

**Files:**

- Create: `docs/name-clearance.md`

**Steps:**

1. Search current web, domain, app-directory, corporate-name, and relevant trademark records.
2. Record exact jurisdictions and product/service categories searched.
3. Identify similar restaurant, meal-wheel, and entertainment apps.
4. Document a strict no-imitation rule for logo, wheel, typography, colors, sounds, slogans, and animations.
5. Mark findings as preliminary product research, not legal advice.
6. Escalate to qualified legal review before paid promotion or major public launch if meaningful conflict remains.
7. Commit:

```bash
git add docs/name-clearance.md
git commit -m "docs: assess working product name"
```

### Task 2: Evaluate restaurant-data providers

**Objective:** Select a production-capable provider for restaurant identity, location, cuisine/type tags, price level, hours, website, and map destination.

**Files:**

- Create: `docs/provider-evaluation.md`
- Create: `src/lib/server/providers/places-provider.ts`
- Test: `tests/server/places-provider-contract.test.ts`

**Contract:**

```ts
export interface RestaurantSearchRequest {
	latitude: number;
	longitude: number;
	radiusMeters: number;
	openNow?: boolean;
	priceLevels?: number[];
}

export interface RestaurantCandidate {
	id: string;
	name: string;
	latitude: number;
	longitude: number;
	distanceMeters?: number;
	cuisineTags: string[];
	providerTypes: string[];
	priceLevel?: number;
	isOpenNow?: boolean;
	rating?: number;
	ratingCount?: number;
	address?: string;
	websiteUrl?: string;
	mapUrl: string;
	attribution?: string;
}

export interface PlacesProvider {
	searchRestaurants(request: RestaurantSearchRequest): Promise<RestaurantCandidate[]>;
}
```

Compare current official terms, caching/display restrictions, required attribution, rate limits, cost, and coverage for at least Google Places, Foursquare Places, Yelp Fusion, and a responsible OpenStreetMap-based option. Test the same urban, suburban, and lower-density locations. Do not treat a public community endpoint as a production SLA.

### Task 3: Scaffold SvelteKit and pin the toolchain

**Objective:** Establish a strict TypeScript SvelteKit PWA project with reproducible scripts.

**Files:**

- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `svelte.config.js`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `src/app.html`
- Create: `.github/workflows/ci.yml`

**Verification:**

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm lint
pnpm test
pnpm build
```

Expected: all checks pass and SvelteKit produces a Vercel-compatible build.

### Task 4: Define restaurant and craving domain types

**Objective:** Create provider-neutral, UI-neutral types before implementing screens.

**Files:**

- Create: `src/lib/domain/restaurant.ts`
- Create: `src/lib/domain/cravings.ts`
- Test: `tests/domain/cravings.test.ts`

**Initial vocabulary:**

- Flavor: salty, sweet, spicy, savory, tangy, smoky
- Texture/temperature: crunchy, creamy, hot, cold
- Mood/appetite: light, hearty, healthy, comforting, adventurous, familiar
- Cuisine: Indian, Mexican, Italian, Chinese, Japanese, Thai, Mediterranean, American, barbecue, seafood
- Food form: pizza, burgers, noodles, rice, soup, sandwiches, tacos, salad, dessert

**TDD example:**

```ts
expect(normalizeCravings(['spicy', 'Indian food'])).toEqual(
	expect.arrayContaining([
		{ kind: 'flavor', value: 'spicy' },
		{ kind: 'cuisine', value: 'indian' }
	])
);
```

Do not infer allergies or dietary restrictions from ambiguous text.

### Task 5: Separate hard constraints from preferences

**Objective:** Ensure required conditions cannot be overridden by randomization or score.

**Files:**

- Create: `src/lib/domain/constraints.ts`
- Test: `tests/domain/constraints.test.ts`

Hard constraints include radius, open-now requirement, selected price levels, required cuisine, and explicit exclusions. Allergy and exact dietary compliance remain unsupported at restaurant-only resolution and must be labeled accordingly.

Write failing tests proving that an ineligible restaurant never reaches the weighted selector, then implement the minimum filter to pass.

### Task 6: Implement transparent scoring

**Objective:** Score eligible restaurants and retain an explanation for each score component.

**Files:**

- Create: `src/lib/domain/scoring.ts`
- Create: `src/lib/domain/explanations.ts`
- Test: `tests/domain/scoring.test.ts`

Tests must prove:

- exact cuisine matches beat untagged restaurants;
- abstract cravings map through an explicit table;
- ratings cannot overwhelm cravings;
- equal inputs produce equal scores;
- sponsored status is never accepted as a hidden scoring input;
- every positive score contribution has a user-readable reason.

### Task 7: Implement seeded weighted selection and reroll exclusion

**Objective:** Preserve surprise while making stronger matches more likely and preventing immediate repetition.

**Files:**

- Create: `src/lib/domain/selection.ts`
- Test: `tests/domain/selection.test.ts`

Tests must cover no candidates, one candidate, deterministic seeds, exclusion of seen IDs, exhaustion behavior, and fixed-seed statistical preference for higher weights.

The selector returns:

```ts
interface SelectionResult {
	restaurant: RestaurantCandidate;
	seed: string;
	eligibleCount: number;
	reasons: MatchReason[];
}
```

### Task 8: Build the mobile-first shell and shared craving flow

**Objective:** Let a group around one phone enter one shared request quickly.

**Files:**

- Create: `src/routes/+layout.svelte`
- Create: `src/routes/+page.svelte`
- Create: `src/routes/decide/+page.svelte`
- Create: `src/lib/components/CravingInput.svelte`
- Create: `src/lib/components/ConstraintControls.svelte`
- Create: `src/lib/state/decision-session.svelte.ts`
- Test: `tests/components/craving-input.test.ts`

**Acceptance criteria:**

- Thumb-friendly controls at narrow widths.
- Free text plus removable craving chips.
- Visible separation among preferred, required, and excluded inputs.
- Radius, open-now, and price controls.
- Decision button disabled until location and meaningful input are present.
- Session state stored in memory/session storage, not a permanent profile.

### Task 9: Implement location permission and manual fallback

**Objective:** Make location useful but never mandatory.

**Files:**

- Create: `src/lib/components/LocationGate.svelte`
- Create: `src/lib/server/location-privacy.ts`
- Test: `tests/components/location-gate.test.ts`
- Test: `e2e/location-fallback.spec.ts`

**Acceptance criteria:**

- Explain the request before invoking browser geolocation.
- Request only current foreground location.
- Work when permission is denied.
- Support manual city/address/ZIP entry through the selected provider or geocoder.
- Show the selected search area before decision.
- Do not put exact coordinates into analytics, URLs, error reports, or ordinary server logs.
- Require HTTPS in deployed environments; permit localhost during development.

### Task 10: Implement the server-side restaurant endpoint

**Objective:** Protect credentials and normalize provider behavior.

**Files:**

- Create: `src/routes/api/restaurants/+server.ts`
- Create: `src/lib/server/providers/selected-provider.ts`
- Test: `tests/server/restaurants-endpoint.test.ts`

**Acceptance criteria:**

- Validate requests with Zod.
- Reject invalid coordinates and unreasonable radii.
- Keep provider secrets in server-only environment variables.
- Rate-limit without retaining exact location.
- Cache only as allowed by provider terms.
- Preserve attribution.
- Normalize retryable versus final failures.
- Return no fabricated fallback restaurants.

### Task 11: Build the wheel reveal without coupling it to selection

**Objective:** Create the product's distinctive moment while preserving honesty, accessibility, and testability.

**Files:**

- Create: `src/lib/components/DecisionWheel.svelte`
- Test: `tests/components/decision-wheel.test.ts`

**Rules:**

- Domain selection happens first.
- The animation only reveals the already-selected restaurant.
- The wheel must not resemble the television show's protected visual presentation.
- Avoid misleading near-miss behavior designed to manipulate engagement.
- Respect `prefers-reduced-motion` by replacing the spin with a short fade/reveal.
- Provide a screen-reader announcement when the result is ready.
- Prevent duplicate submit/spin actions while selection is pending.

### Task 12: Build the result and reroll flow

**Objective:** End with one actionable restaurant rather than another comparison screen.

**Files:**

- Create: `src/routes/result/+page.svelte`
- Create: `src/lib/components/RestaurantResult.svelte`
- Test: `tests/components/restaurant-result.test.ts`
- Test: `e2e/decision-flow.spec.ts`

Display restaurant name, distance, open status when known, price level when known, two or three match reasons, Open in Maps, Reroll, and Change cravings.

Do not lead with star ratings. Ratings may be supporting context, but this is a decision tool rather than a ranked review directory.

### Task 13: Add explicit fallback behavior

**Objective:** Broaden a failed search only with the user's knowledge.

**Files:**

- Create: `src/lib/domain/fallbacks.ts`
- Test: `tests/domain/fallbacks.test.ts`

Fallback sequence:

1. Explain the limiting constraint.
2. Offer a larger radius.
3. Offer to remove open-now only with consent.
4. Offer to change a required cuisine to preferred.
5. Never relax explicit exclusions automatically.
6. Never treat missing hours as definitely open, closed, or safe.

### Task 14: Implement the PWA manifest and service worker

**Objective:** Make the app installable and provide a reliable offline shell without pretending live restaurant searches work offline.

**Files:**

- Create: `static/manifest.webmanifest`
- Create: `static/icons/`
- Create: `src/service-worker.ts`
- Create: `src/lib/components/InstallPrompt.svelte`
- Test: `e2e/installability.spec.ts`

**Caching policy:**

- Precache built JS, CSS, icons, and shell assets.
- Do not cache precise-location requests.
- Do not cache restaurant-provider responses unless provider terms explicitly allow it.
- Show a clear offline state for live searches.
- Never show stale restaurants as current/open without labeling freshness.
- Test Android installation and iOS Add to Home Screen instructions separately.

### Task 15: Add privacy-minimized analytics only after the core flow works

**Objective:** Measure decision usefulness without collecting sensitive location or free text.

**Files:**

- Create: `docs/analytics-events.md`
- Create: `src/lib/analytics.ts`
- Test: `tests/analytics.test.ts`

Permitted event shapes include session started, decision requested, result shown, reroll, maps opened, fallback accepted, and session abandoned. Exclude exact coordinates, restaurant names, raw free text, device advertising IDs, and raw provider responses. Keep analytics disabled in the first internal build.

### Task 16: Verify quality, accessibility, and deployment

**Objective:** Prove the PWA works on real phones and degraded networks.

**Files:**

- Create: `playwright.config.ts`
- Create: `docs/device-test-matrix.md`
- Modify: `.github/workflows/ci.yml`

**Commands:**

```bash
pnpm check
pnpm lint
pnpm test
pnpm exec playwright test
pnpm build
```

Test at minimum:

- Android Chrome installation;
- iOS Safari Add to Home Screen before claiming iOS PWA support;
- narrow and wide viewports;
- foreground location granted;
- location denied with manual fallback;
- offline shell;
- provider timeout;
- zero matches;
- reroll exhaustion;
- large text and screen reader;
- reduced motion;
- keyboard navigation;
- provider secret absence from client bundles.

### Task 17: Conduct five real decision sessions

**Objective:** Validate that the restaurant-only experience reduces indecision before adding menu ingestion.

**Files:**

- Create: `docs/product-validation.md`

With consent, observe five decisions involving at least two people. Record time to result, number of edits, rerolls, acceptance, rejection reasons, and whether the group opened another directory to continue comparing.

**MVP success signal:** Most sessions reach an accepted destination in under two minutes without browsing a long list.

Menu randomization begins only if users frequently accept the restaurant but still experience meaningful dish-level indecision.

## 6. PWA-specific risks

| Risk                                                      | Mitigation                                                                      |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| iOS and Android PWA capabilities differ                   | Maintain a physical-device matrix; never infer parity from desktop              |
| Browser location is denied                                | Manual location is a first-class path                                           |
| Offline mode implies stale/open-now accuracy              | Cache shell only; label or avoid stale place data                               |
| Service-worker updates strand old clients                 | Version assets and test update behavior                                         |
| Provider key leaks into browser code                      | Server-only SvelteKit endpoint and bundle inspection                            |
| Public mapping APIs are used beyond their terms           | Provider evaluation and approved caching/display policy                         |
| Wheel animation is inaccessible or manipulative           | Predetermined result, reduced-motion mode, no fake near misses                  |
| Working name creates confusion with an entertainment mark | Clearance task and distinct identity/trade dress                                |
| Most of app becomes client-only and slow                  | SSR/prerender shell; hydrate only app interactions; measure real mobile startup |

## 7. Monetization strategy

### Trust boundary

The core qualified-random selection must remain independent of payment. A restaurant may not secretly purchase extra probability, removal of competitors, favorable match reasons, or a fabricated claim that it satisfies a craving. Any paid placement must be visually labeled and separated from the organic result.

Never sell precise location histories, raw cravings, relationship/group behavior, or identifiable decision histories.

### Option A: Post-decision affiliate revenue

After the wheel selects an organic result, offer useful actions such as:

- reserve a table;
- order pickup or delivery;
- purchase a restaurant gift card;
- claim an independently verified offer.

Where an authorized partner program exists, Meal of Fortune can earn a referral or completed-action commission. The original restaurant choice must remain unchanged whether or not that restaurant has an affiliate relationship.

**Advantages:** Revenue follows a high-intent decision; little interruption; no need to charge the user.

**Risks:** Partner availability and terms vary; commission attribution can be unreliable; an affiliate relationship must be disclosed.

**Product rule:** Always provide a neutral Open in Maps or Visit restaurant option even when a paid action is available.

### Option B: Consumer premium tier

Keep the complete core decision flow free. Charge for optional convenience and personalization features introduced only after users request them, such as:

- saved favorite restaurants and exclusions;
- remembered craving presets;
- custom wheels for date night, family night, lunch, dessert, or travel;
- multi-device group voting in a later release;
- shared household profiles;
- decision history and “do not repeat this month” controls;
- advanced radius, travel-time, and neighborhood controls;
- ad-free use if advertising is introduced;
- custom themes and wheel appearances that do not imitate protected trade dress.

Test a modest subscription and a one-time lifetime unlock rather than assuming recurring billing is appropriate for an intermittently used utility.

**Advantages:** Aligns revenue with user value and preserves restaurant neutrality.

**Risks:** Restaurant indecision may not occur often enough to support a subscription; permanent profile storage increases privacy and account complexity.

### Option C: Clearly separated local restaurant promotions

A restaurant can purchase a labeled promotion shown after or alongside—but not disguised as—the organic result. Examples:

- “Nearby offer” beneath the result;
- a coupon presented only when the selected restaurant itself provided it;
- an optional “Spin sponsored specials” mode the user deliberately enters;
- a clearly labeled local restaurant spotlight on the home screen.

**Advantages:** Direct local-business revenue and potentially useful deals.

**Risks:** Sales and support effort; visual clutter; loss of trust if labeling or separation is weak.

**Non-negotiable:** A paid restaurant receives no hidden weight in the normal wheel.

### Option D: Restaurant subscription tools

Offer restaurants a separate business product that improves data quality without buying ranking:

- claim and verify restaurant details;
- maintain cuisine and atmosphere tags;
- publish current specials or gift-card links;
- report whether users opened directions, reservations, or ordering after an organic selection;
- correct closed hours or inaccurate links;
- later maintain authorized structured menu data.

Charge a monthly software/listing-management fee for these tools. Verified data may improve eligibility only by making factual information complete; payment itself cannot change organic score.

**Advantages:** Recurring B2B revenue and better product data.

**Risks:** Merchant onboarding, moderation, fraud prevention, and factual-verification burden.

### Option E: White-label and venue licensing

License a branded version to places where groups regularly make food decisions:

- hotels and resorts;
- tourism bureaus;
- malls and food halls;
- universities;
- office campuses;
- apartment communities;
- event venues;
- local chambers of commerce.

Possible products include a hosted branded PWA, lobby kiosk, QR-code experience, or curated geographic wheel.

**Advantages:** Higher-value contracts and less dependence on consumer subscriptions.

**Risks:** Customization pressure, longer sales cycles, venue-specific data, and contractual support expectations.

### Option F: Carefully limited advertising

Conventional display advertising is technically possible but is the weakest early fit. Banners can make a playful, decisive experience feel cheap and distract users at the moment of choice.

If used later:

- keep ads away from the spinning wheel and primary result;
- prohibit ads that visually resemble organic restaurants;
- avoid behavioral targeting based on precise location or cravings;
- do not require watching an ad to see the first result;
- measure whether ads increase abandonment or rerolls.

### Option G: Tips or supporter purchase

A simple “Support the app” payment or low-cost cosmetic supporter pack can fund an early utility without requiring accounts or distorting restaurant selection.

**Advantages:** Simple and trust-preserving.

**Risks:** Usually modest and unpredictable revenue.

### Recommended sequence

#### Stage 0 — Validate usefulness

Launch the core experience free and without ads. Measure whether groups accept results and open directions. Do not build a merchant dashboard or subscription before proving repeat use.

#### Stage 1 — Monetize completed intent

Add neutral post-result links, then test authorized reservation, ordering, gift-card, or offer referrals where available. Clearly disclose affiliate relationships and retain a neutral action.

#### Stage 2 — Test consumer willingness to pay

Prototype a small premium bundle using requested features such as saved wheels, household preferences, and repeat avoidance. Compare a one-time unlock with a subscription.

#### Stage 3 — Test local B2B demand

Interview restaurants, hotels, food halls, and tourism organizations. Offer verified data, offers, and white-label experiences without selling organic probability.

#### Stage 4 — Add merchant tooling only after demand is proven

Build claim/verification, specials, analytics, and later authorized menu management only if merchants demonstrate willingness to pay.

### Monetization experiments to record

- Percentage of accepted results that open Maps.
- Percentage that choose reserve/order when available.
- Repeat sessions per household per month.
- Demand for saved wheels and repeat avoidance.
- User reaction to clearly labeled promotions.
- Restaurant willingness to pay for verified data or offers.
- Venue willingness to license a local branded wheel.
- Abandonment changes when any monetization surface is introduced.

Revenue experiments must be evaluated alongside trust, acceptance rate, time to decision, privacy, and retention—not revenue alone.

## 8. Open product decisions

1. Whether “Meal of Fortune” clears preliminary naming research.
2. Final visual personality—playful game, calm decision assistant, or a restrained blend.
3. Production restaurant-data provider.
4. Default radius and whether it adapts to place density.
5. Whether star ratings influence weight at all.
6. Whether reroll asks for a reason that adjusts only the current session.
7. Whether a “true surprise” mode ignores soft cravings but preserves hard constraints.
8. Which first revenue experiment fits actual usage: post-result affiliate action, premium unlock, supporter purchase, or a local B2B pilot.
9. Whether saved favorites/history justify later accounts and persistent personal data.
10. Whether Vercel remains the deployment host after provider and cost evaluation.

## 9. Phase-two menu randomization gate

Exact dish selection requires a separate plan and verified menu-data rights. It must address freshness, item availability, prices/variants, dietary and allergen provenance, attribution, restaurant linking, and fallback behavior.

```text
restaurant selected
        ↓
authorized current menu available?
   ↙ yes                    ↘ no
weighted exact dish       labeled dish-category suggestion
```

Never present an AI-inferred or category-level suggestion as a current restaurant menu item.

## 10. Definition of MVP done

- [ ] Working name has documented preliminary clearance status.
- [ ] PWA installs on supported Android and iOS devices.
- [ ] Shared cravings accept abstract and specific input.
- [ ] GPS and manual location both work.
- [ ] Hard constraints are distinct from soft preferences.
- [ ] Provider data comes through a server-side adapter.
- [ ] Ineligible restaurants are filtered before selection.
- [ ] Weighted selection is deterministic in tests and non-repeating per session.
- [ ] Wheel reveal is accessible, honest, and visually distinct from the television property.
- [ ] One result includes meaningful reasons and map action.
- [ ] Reroll, edit, no-match, offline, and provider-error paths work.
- [ ] No provider secrets or exact location appear in client bundles or analytics.
- [ ] CI, unit, component, and Playwright tests pass.
- [ ] Physical Android and iOS PWA checks pass before broad release.
- [ ] Five real sessions show whether the product reduces decision time.
