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

	it('forwards active and already-aborted caller signals with their reasons', async () => {
		const fetcher = vi.fn<typeof fetch>((_url, init) => {
			const signal = init?.signal;
			if (signal?.aborted) return Promise.reject(signal.reason);
			return new Promise<Response>((_resolve, reject) => {
				signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
			});
		});
		const active = new AbortController();
		const activeReason = new Error('active caller cancelled');
		const activeRequest = requestLiveRestaurants(
			{ location: { area: '30318' }, radiusMiles: 4 },
			{ fetcher, signal: active.signal }
		);
		active.abort(activeReason);
		await expect(activeRequest).rejects.toBe(activeReason);

		const alreadyAborted = new AbortController();
		const priorReason = new Error('caller was already cancelled');
		alreadyAborted.abort(priorReason);
		await expect(
			requestLiveRestaurants(
				{ location: { area: '30318' }, radiusMiles: 4 },
				{ fetcher, signal: alreadyAborted.signal }
			)
		).rejects.toBe(priorReason);
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
		expect(isValidLiveRestaurant({ ...validRestaurant, distanceMiles: -0.1 })).toBe(false);
		expect(isValidLiveRestaurant({ ...validRestaurant, rating: Number.NaN })).toBe(false);
		expect(isValidLiveRestaurant({ ...validRestaurant, ratingCount: 2.5 })).toBe(false);
		expect(isValidLiveRestaurant({ ...validRestaurant, mapsUri: 123 })).toBe(false);
	});
});
