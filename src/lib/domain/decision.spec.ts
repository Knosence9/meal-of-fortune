import { describe, expect, it } from 'vitest';

import { DECISION_WEIGHTS, decideRestaurant, type RestaurantCandidate } from './decision';

const restaurants: RestaurantCandidate[] = [
	{
		id: 'nearby-cafe',
		name: 'Nearby Cafe',
		cuisines: ['american'],
		traits: ['savory'],
		distanceMiles: 1.2,
		priceLevel: 2,
		isOpen: true
	},
	{
		id: 'faraway-cafe',
		name: 'Faraway Cafe',
		cuisines: ['american'],
		traits: ['savory'],
		distanceMiles: 8.4,
		priceLevel: 2,
		isOpen: true
	}
];

describe('decideRestaurant', () => {
	it('uses the documented scoring coefficients', () => {
		expect(DECISION_WEIGHTS).toEqual({
			base: 1,
			cuisineMatch: 4,
			traitMatch: 2,
			abstractMatch: 4
		});
	});

	it('returns no decision when no candidate is eligible', () => {
		const result = decideRestaurant({
			candidates: restaurants,
			cravings: ['savory'],
			constraints: { radiusMiles: 0.5, openNow: true, priceLevels: [] },
			seenIds: []
		});

		expect(result).toBeNull();
	});

	it('returns the only eligible candidate regardless of the random draw', () => {
		const result = decideRestaurant({
			candidates: [restaurants[0]],
			cravings: ['savory'],
			constraints: { radiusMiles: 5, openNow: true, priceLevels: [] },
			seenIds: [],
			random: () => 0.99
		});

		expect(result?.restaurant.id).toBe('nearby-cafe');
	});

	it('returns no decision when the eligible reroll cycle is exhausted', () => {
		const result = decideRestaurant({
			candidates: [restaurants[0]],
			cravings: ['savory'],
			constraints: { radiusMiles: 5, openNow: true, priceLevels: [] },
			seenIds: ['nearby-cafe']
		});

		expect(result).toBeNull();
	});

	it('excludes restaurants outside the selected radius before choosing', () => {
		const result = decideRestaurant({
			candidates: restaurants,
			cravings: ['savory'],
			constraints: { radiusMiles: 5, openNow: true, priceLevels: [] },
			seenIds: [],
			random: () => 0.99
		});

		expect(result?.restaurant.id).toBe('nearby-cafe');
	});

	it('never chooses a closed restaurant when open now is required', () => {
		const result = decideRestaurant({
			candidates: [
				{ ...restaurants[0], id: 'closed', name: 'Closed Cafe', isOpen: false },
				{ ...restaurants[0], id: 'open', name: 'Open Cafe', isOpen: true }
			],
			cravings: ['savory'],
			constraints: { radiusMiles: 5, openNow: true, priceLevels: [] },
			seenIds: [],
			random: () => 0
		});

		expect(result?.restaurant.id).toBe('open');
	});

	it('uses craving matches as weights while preserving a random draw', () => {
		const result = decideRestaurant({
			candidates: [
				{
					...restaurants[0],
					id: 'unrelated',
					name: 'Unrelated Grill',
					cuisines: ['american'],
					traits: ['smoky']
				},
				{
					...restaurants[0],
					id: 'matching',
					name: 'Matching Kitchen',
					cuisines: ['indian'],
					traits: ['spicy']
				}
			],
			cravings: ['indian', 'spicy'],
			constraints: { radiusMiles: 5, openNow: true, priceLevels: [] },
			seenIds: [],
			random: () => 0.2
		});

		expect(result?.restaurant.id).toBe('matching');
		expect(result?.reasons).toEqual(['Indian cuisine', 'Spicy']);
	});

	it('excludes previously seen restaurants while unseen options remain', () => {
		const result = decideRestaurant({
			candidates: [
				{ ...restaurants[0], id: 'already-seen' },
				{ ...restaurants[0], id: 'fresh-choice' }
			],
			cravings: ['savory'],
			constraints: { radiusMiles: 5, openNow: true, priceLevels: [] },
			seenIds: ['already-seen'],
			random: () => 0
		});

		expect(result?.restaurant.id).toBe('fresh-choice');
	});

	it('excludes restaurants outside the selected price levels', () => {
		const result = decideRestaurant({
			candidates: [
				{ ...restaurants[0], id: 'expensive', priceLevel: 3 },
				{ ...restaurants[0], id: 'budget', priceLevel: 1 }
			],
			cravings: ['savory'],
			constraints: { radiusMiles: 5, openNow: true, priceLevels: [1] },
			seenIds: [],
			random: () => 0
		});

		expect(result?.restaurant.id).toBe('budget');
	});

	it('does not treat an unknown price as free or as a selected price tier', () => {
		const unknownPrice = { ...restaurants[0], id: 'unknown-price', priceLevel: null };
		const withoutPriceFilter = decideRestaurant({
			candidates: [unknownPrice],
			cravings: [],
			constraints: { radiusMiles: 5, openNow: true, priceLevels: [] },
			seenIds: [],
			random: () => 0
		});
		const withPriceFilter = decideRestaurant({
			candidates: [unknownPrice],
			cravings: [],
			constraints: { radiusMiles: 5, openNow: true, priceLevels: [1] },
			seenIds: [],
			random: () => 0
		});

		expect(withoutPriceFilter?.restaurant.id).toBe('unknown-price');
		expect(withPriceFilter).toBeNull();
	});

	it('maps abstract cravings to related restaurant traits', () => {
		const result = decideRestaurant({
			candidates: [
				{
					...restaurants[0],
					id: 'unrelated',
					name: 'Unrelated Grill',
					traits: ['fresh']
				},
				{
					...restaurants[0],
					id: 'comforting',
					name: 'Comfort Kitchen',
					traits: ['comfort']
				}
			],
			cravings: ['cozy'],
			constraints: { radiusMiles: 5, openNow: true, priceLevels: [] },
			seenIds: [],
			random: () => 0.2
		});

		expect(result?.restaurant.id).toBe('comforting');
		expect(result?.reasons).toEqual(['Cozy mood']);
	});
});
