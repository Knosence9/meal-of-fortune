# Meal of Fortune

**Stop scrolling. Start spinning.**

Meal of Fortune is a mobile-first progressive web app for the familiar moment when a group wants food but cannot decide what sounds good. Add shared cravings, set practical boundaries, and let a transparent weighted draw choose one qualified restaurant.

> [!IMPORTANT]
> The current MVP uses an explicitly labeled curated demo restaurant set. It does not claim that those entries are live local businesses. Live nearby search will follow the provider coverage, terms, privacy, and cost evaluation in issue #1.

## Product principles

1. **Filter first, randomize second.** Distance, opening status, price, and exclusions are eligibility rules—not suggestions.
2. **One answer beats another directory.** The interface returns one restaurant and a controlled reroll, not a ranked list.
3. **Chance should remain honest.** Craving matches improve probability, but paid placement never changes the normal wheel.
4. **Explain the result.** The app shows which cravings matched.
5. **Location should stay private.** The MVP requests foreground location only and does not persist exact coordinates.

## MVP capabilities

- Shared abstract or specific craving chips
- Manual-area and foreground-location controls
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
provider-neutral restaurant candidates
    ↓
hard eligibility filters
    ↓
transparent craving weights
    ↓
random draw + match reasons
    ↓
accessible result reveal
```

The selection engine lives in `src/lib/domain/decision.ts` and has no browser or provider dependency. Demo records live separately in `src/lib/data/demo-restaurants.ts`. A future live provider will enter through a server-only adapter so credentials never reach the browser bundle.

## Roadmap

- [x] Tested decision engine
- [x] Mobile-first MVP interface
- [x] Deterministic demo data boundary
- [x] PWA shell
- [ ] Place-provider evaluation
- [ ] Live nearby restaurant search
- [ ] Real-device Android/iOS PWA validation
- [ ] Five observed group decision sessions
- [ ] Post-result affiliate experiment, only after usefulness is proven
- [ ] Menu-level decision support, only after a separate data-rights assessment

## Planning and provenance

- [Implementation plan](.hermes/plans/2026-07-20_151941-meal-of-fortune-pwa.md)
- [MVP work packet](https://github.com/Knosence9/meal-of-fortune/issues/1)

## License

[MIT](LICENSE)
