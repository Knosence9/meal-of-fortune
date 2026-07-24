# Meal of Fortune

**Stop scrolling. Start spinning.**

Meal of Fortune is a mobile-first progressive web app for the familiar moment when a group wants food but cannot decide what sounds good. Add shared cravings, set practical boundaries, and let a transparent weighted draw choose one qualified restaurant.

> [!IMPORTANT]
> The app includes an optional server-side Google Places integration and an explicitly labeled demo fallback. Live production mode requires `GOOGLE_PLACES_API_KEY`, the Places API (New), and the Geocoding API. Do not enable billing or deploy a key without an owner-approved hard quota and cost cap.

## Product principles

1. **Filter first, randomize second.** Distance, opening status, price, and exclusions are eligibility rules—not suggestions.
2. **One answer beats another directory.** The interface returns one restaurant and a controlled reroll, not a ranked list.
3. **Chance should remain honest.** Craving matches improve probability, but paid placement never changes the normal wheel.
4. **Explain the result.** The app shows which cravings matched.
5. **Location should stay private.** Foreground coordinates, entered areas, and provider results stay in short-lived page memory and are never placed in application caches or durable browser storage.
6. **Ratings are context, not control.** The aggregate Google rating and count are displayed together, but do not alter selection odds.

## MVP capabilities

- Shared abstract or specific craving chips
- Manual-area and foreground-location controls
- Server-only Google Places and Geocoding adapters
- Live names, addresses, distance, hours, price, aggregate rating/count, and Google Maps links
- Radius, open-now, and price constraints
- Tested weighted selection with match reasons
- Non-repeating rerolls until eligible choices are exhausted
- Reduced-motion-aware wheel reveal
- Installable PWA manifest and offline application shell
- Responsive mobile and desktop layout
- Vercel-ready SvelteKit adapter

## Development

All project commands run through the pinned Nix shell:

```bash
nix develop --command pnpm install --frozen-lockfile
nix develop --command pnpm dev
```

Open the local URL printed by Vite.

Without a key, the app remains in honest demo mode and `/api/restaurants` fails closed. To exercise live mode locally after the Google Cloud billing/quota boundary is approved:

```bash
cp .env.example .env
# Set GOOGLE_PLACES_API_KEY locally; never commit or paste it into chat.
nix develop --command pnpm dev
```

Required Google APIs:

- Places API (New), Nearby Search Enterprise fields
- Geocoding API for manually entered U.S. city/state or ZIP searches

The Places field mask requests only place ID, name, coordinates, address, business status, types, current open status, price level, aggregate rating, rating count, and Google Maps URI. It does not request reviews, review text, or photos.

Current published pricing should be rechecked before activation. At implementation time, Nearby Search Enterprise included 1,000 monthly requests at no charge and then started at $35 per 1,000 requests. The production project uses both of these provider-side overrides:

- Nearby Search: 10 requests/minute and 30 requests/day
- Geocoding: 10 requests/minute and 30 requests/day

Thirty Nearby Search requests per day caps a 31-day month at 930, preserving headroom below the researched 1,000-request allowance. A project- and service-scoped $1 monthly spend cap tracks gross costs with credits excluded and sends alerts at 50%, 90%, and 100%. The endpoint also validates JSON before provider work and limits each adapter-provided client address to three valid searches per minute per warm server instance; Google’s project-level quotas remain the global enforcement layer across instances. Provider calls abort after eight seconds, browser calls abort after twelve seconds, and newer searches cancel superseded browser requests. Manual-area geocoding is restricted to the United States and rejects multiple, partial, non-U.S., or incomplete matches before Nearby Search. Users must enter a specific city and state or ZIP code.

Provider quotas and spend controls are operational requirements, not substitutes for server-only credentials, request validation, or application throttling.

### Verification

```bash
nix develop --command pnpm check
nix develop --command pnpm lint
nix develop --command pnpm test
nix develop --command pnpm build
```

The Nix shell provides pinned Chromium on Linux:

```bash
nix develop --command pnpm test:e2e
```

On macOS, install Playwright-managed Chromium once before running the same test command:

```bash
nix develop --command pnpm exec playwright install chromium
nix develop --command pnpm test:e2e
```

## Architecture

```text
SvelteKit UI
    ↓
POST /api/restaurants (validated, no-store)
    ↓
server-only Google Geocoding + Places adapter
    ↓
provider-neutral in-memory restaurant candidates
    ↓
hard eligibility filters
    ↓
transparent craving weights
    ↓
random draw + match reasons
    ↓
accessible result reveal
```

The selection engine lives in `src/lib/domain/decision.ts` and has no browser or provider dependency. Demo records live separately in `src/lib/data/demo-restaurants.ts`. Google access is isolated under `src/lib/server/`, and the key is read only by the SvelteKit server route. The service worker explicitly bypasses `/api/` requests.

## Roadmap

- [x] Tested decision engine
- [x] Mobile-first MVP interface
- [x] Deterministic demo data boundary
- [x] PWA shell
- [x] Place-provider evaluation
- [x] Tested live nearby restaurant adapter and ratings UI
- [x] Owner-approved Google billing, spend cap, quotas, and restricted production key
- [ ] Reviewed live deployment and production provider verification
- [ ] Real-device Android/iOS PWA validation
- [ ] Five observed group decision sessions
- [ ] Post-result affiliate experiment, only after usefulness is proven
- [ ] Menu-level decision support, only after a separate data-rights assessment

## Planning and provenance

- [Implementation plan](.hermes/plans/2026-07-20_151941-meal-of-fortune-pwa.md)
- [MVP work packet](https://github.com/Knosence9/meal-of-fortune/issues/1)
- [Live Google restaurant search](https://github.com/Knosence9/meal-of-fortune/issues/3)

## License

[MIT](LICENSE)
