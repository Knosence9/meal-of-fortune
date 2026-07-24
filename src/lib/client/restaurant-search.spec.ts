import { describe, expect, it, vi } from 'vitest';

import { isValidLiveRestaurant, requestLiveRestaurants } from './restaurant-search';

function isAborted(signal: AbortSignal | null): boolean {
	return signal?.aborted === true;
}

describe('requestLiveRestaurants', () => {
	it('aborts a stalled browser request after the configured timeout', async () => {
		let requestSignal: AbortSignal | null = null;
		const fetcher = vi.fn<typeof fetch>((_url, init) => {
			requestSignal = init?.signal ?? null;
			return new Promise<Response>((_resolve, reject) => {
				requestSignal?.addEventListener('abort', () => reject(requestSignal?.reason));
			});
		});

		await expect(
			requestLiveRestaurants(
				{ location: { area: '30318' }, radiusMiles: 4 },
				{ fetcher, timeoutMs: 5 }
			)
		).rejects.toThrow();
		expect(requestSignal).not.toBeNull();
		expect(isAborted(requestSignal)).toBe(true);
	});
});

describe('isValidLiveRestaurant', () => {
	const validRestaurant = {
		source: 'google',
		id: 'place-1',
		name: 'Safe Cafe',
		cuisines: ['cafe'],
		traits: [],
		distanceMiles: 1.2,
		priceLevel: null,
		isOpen: true,
		address: '1 Main Street'
	};

	it('accepts absent optional Google fields and rejects malformed values', () => {
		expect(isValidLiveRestaurant(validRestaurant)).toBe(true);
		expect(isValidLiveRestaurant({ ...validRestaurant, rating: Number.NaN })).toBe(false);
		expect(isValidLiveRestaurant({ ...validRestaurant, ratingCount: 2.5 })).toBe(false);
		expect(isValidLiveRestaurant({ ...validRestaurant, mapsUri: 123 })).toBe(false);
	});
});
