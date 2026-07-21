# Agent Instructions

## Project

Meal of Fortune is a SvelteKit PWA that turns shared cravings into one qualified restaurant decision. The current MVP is intentionally restaurant-only and uses labeled demo data until a live provider is selected.

## Required workflow

- Run all project commands through `nix develop --command …`.
- Use strict RED–GREEN–REFACTOR for behavior changes.
- Keep provider credentials and exact locations out of client bundles, logs, fixtures, screenshots, analytics, and corpus records.
- Do not create paid provider services, enable billing, purchase domains, or change repository permissions without explicit user approval.
- Never let sponsorship or affiliate status alter the normal selection weight.
- Preserve honest demo/live-data labeling.
- Use short-lived branches, conventional commits, pull requests, and squash merge.

## Verification gate

```bash
nix develop --command pnpm check
nix develop --command pnpm lint
nix develop --command pnpm test
nix develop --command pnpm build
```

## Architecture boundaries

- `src/lib/domain/`: provider- and UI-independent decision logic.
- `src/lib/data/`: explicitly labeled demo fixtures only.
- `src/lib/server/`: future provider adapters and secret-bearing code.
- `src/routes/`: SvelteKit UI and server routes.
- `src/service-worker.ts`: static application shell only; do not cache precise-location or provider API requests.
