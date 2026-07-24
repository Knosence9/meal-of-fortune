import { describe, expect, it, vi } from 'vitest';

import { requestLiveRestaurants } from './restaurant-search';

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
