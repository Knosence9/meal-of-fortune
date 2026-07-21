# Architecture decisions

## ADR-001: SvelteKit instead of Astro

**Status:** Accepted for the MVP.

Meal of Fortune is dominated by interactive state rather than static content: location permission, craving input, hard constraints, weighted selection, animation, rerolls, and installability. SvelteKit keeps UI, server-only provider routes, and service-worker support in one project without turning the entire product into one large Astro island.

## ADR-002: Filter before randomization

**Status:** Accepted and covered by tests.

Distance, open status, selected prices, exclusions, and later required cuisines determine eligibility. Only eligible restaurants receive weights. Craving matches affect probability but do not create eligibility.

## ADR-003: Demo provider before paid provider

**Status:** Accepted for the first public MVP.

A curated, clearly labeled dataset makes the interaction testable and reviewable without hiding a paid-service decision inside scaffolding. The interface must never represent demo entries as current local listings.

## ADR-004: Selection before animation

**Status:** Accepted.

The domain engine chooses the result before the wheel moves. Animation reveals the choice and respects reduced-motion preferences; it does not manipulate odds or create fake near misses.

## ADR-005: No hidden sponsored weight

**Status:** Accepted as a product trust boundary.

Affiliate and promotional revenue may appear only in clearly disclosed surfaces around or after an organic result. Payment cannot alter the normal wheel.
