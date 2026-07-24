import { describe, expect, it } from 'vitest';

import { parseRestaurantSearchRequest } from './restaurant-search-request';

describe('parseRestaurantSearchRequest', () => {
	it('accepts bounded coordinates without retaining unrelated input', () => {
		expect(
			parseRestaurantSearchRequest({
				location: { latitude: 33.75, longitude: -84.39 },
				radiusMiles: 5,
				ignored: 'do not forward'
			})
		).toEqual({
			location: { latitude: 33.75, longitude: -84.39 },
			radiusMiles: 5
		});
	});

	it.each([
		[{ location: { latitude: 91, longitude: 0 }, radiusMiles: 5 }, 'latitude'],
		[{ location: { latitude: 0, longitude: -181 }, radiusMiles: 5 }, 'longitude'],
		[{ location: { latitude: 0, longitude: 0 }, radiusMiles: 0 }, 'radius'],
		[{ location: { latitude: 0, longitude: 0 }, radiusMiles: 11 }, 'radius'],
		[{ location: { area: '' }, radiusMiles: 5 }, 'area'],
		[{ location: { area: 'a'.repeat(121) }, radiusMiles: 5 }, 'area']
	])('rejects an invalid paid-search request', (input, expectedMessage) => {
		expect(() => parseRestaurantSearchRequest(input)).toThrow(expectedMessage);
	});
});
