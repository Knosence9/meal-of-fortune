export interface RestaurantCandidate {
	id: string;
	name: string;
	cuisines: string[];
	traits: string[];
	distanceMiles: number;
	priceLevel: number | null;
	isOpen: boolean;
}

export interface DecisionConstraints {
	radiusMiles: number;
	openNow: boolean;
	priceLevels: number[];
}

export interface RestaurantDecision {
	restaurant: RestaurantCandidate;
	reasons: string[];
}

export interface DecideRestaurantInput {
	candidates: RestaurantCandidate[];
	cravings: string[];
	constraints: DecisionConstraints;
	seenIds: string[];
	random?: () => number;
}

export const DECISION_WEIGHTS = Object.freeze({
	base: 1,
	cuisineMatch: 4,
	traitMatch: 2,
	abstractMatch: 4
});

const ABSTRACT_CRAVINGS: Record<string, { traits: string[]; reason: string }> = {
	bold: { traits: ['spicy', 'smoky'], reason: 'Bold flavors' },
	cozy: { traits: ['comfort', 'hearty'], reason: 'Cozy mood' },
	light: { traits: ['light', 'fresh', 'healthy'], reason: 'Light mood' }
};

export function decideRestaurant({
	candidates,
	cravings,
	constraints,
	seenIds,
	random = Math.random
}: DecideRestaurantInput): RestaurantDecision | null {
	const seen = new Set(seenIds);
	const eligible = candidates.filter(
		(restaurant) =>
			!seen.has(restaurant.id) &&
			restaurant.distanceMiles <= constraints.radiusMiles &&
			(!constraints.openNow || restaurant.isOpen) &&
			(constraints.priceLevels.length === 0 ||
				(restaurant.priceLevel !== null && constraints.priceLevels.includes(restaurant.priceLevel)))
	);

	if (eligible.length === 0) return null;

	const normalizedCravings = cravings
		.map((craving) => craving.trim().toLowerCase())
		.filter(Boolean);
	const cravingSet = new Set(normalizedCravings);
	const weighted = eligible.map((restaurant) => {
		const cuisineMatches = restaurant.cuisines.filter((cuisine) =>
			cravingSet.has(cuisine.toLowerCase())
		);
		const traitMatches = restaurant.traits.filter((trait) => cravingSet.has(trait.toLowerCase()));
		const normalizedTraits = new Set(restaurant.traits.map((trait) => trait.toLowerCase()));
		const abstractMatches = Object.entries(ABSTRACT_CRAVINGS).filter(
			([craving, mapping]) =>
				cravingSet.has(craving) && mapping.traits.some((trait) => normalizedTraits.has(trait))
		);
		const reasons = [
			...cuisineMatches.map((cuisine) => `${titleCase(cuisine)} cuisine`),
			...traitMatches.map(titleCase),
			...abstractMatches.map(([, mapping]) => mapping.reason)
		];

		return {
			restaurant,
			reasons,
			weight:
				DECISION_WEIGHTS.base +
				cuisineMatches.length * DECISION_WEIGHTS.cuisineMatch +
				traitMatches.length * DECISION_WEIGHTS.traitMatch +
				abstractMatches.length * DECISION_WEIGHTS.abstractMatch
		};
	});

	const totalWeight = weighted.reduce((total, candidate) => total + candidate.weight, 0);
	let draw = Math.min(Math.max(random(), 0), 0.999999999999) * totalWeight;

	for (const candidate of weighted) {
		draw -= candidate.weight;
		if (draw < 0) {
			return { restaurant: candidate.restaurant, reasons: candidate.reasons };
		}
	}

	const fallback = weighted[weighted.length - 1];
	return { restaurant: fallback.restaurant, reasons: fallback.reasons };
}

function titleCase(value: string): string {
	return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}
