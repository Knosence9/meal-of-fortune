import { describe, expect, it, vi } from 'vitest';

import { GoogleAreaResolutionError } from './google-places';
import { createRestaurantSearchHandler } from './restaurant-search-handler';

function post(body: unknown): Request {
	return new Request('http://localhost/api/restaurants', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
}

const validBody = {
	location: { latitude: 33.75, longitude: -84.39 },
	radiusMiles: 5
};

describe('createRestaurantSearchHandler', () => {
	it('fails closed without calling the provider when live search is unconfigured', async () => {
		const search = vi.fn();
		const response = await createRestaurantSearchHandler({ apiKey: '', search })(post(validBody));

		expect(response.status).toBe(503);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({
			configured: false,
			error: 'Live restaurant search is not configured.'
		});
		expect(search).not.toHaveBeenCalled();
	});

	it('returns bounded live candidates without allowing response caching', async () => {
		const restaurants = [{ id: 'real-1', name: 'Real Restaurant' }];
		const search = vi.fn().mockResolvedValue(restaurants);
		const request = post(validBody);
		const response = await createRestaurantSearchHandler({ apiKey: 'server-key', search })(request);

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(await response.json()).toEqual({ configured: true, restaurants });
		expect(search).toHaveBeenCalledWith(validBody, {
			apiKey: 'server-key',
			signal: request.signal
		});
	});

	it('rate-limits a client before calling the paid provider', async () => {
		const search = vi.fn();
		const checkRateLimit = vi.fn(() => ({ allowed: false, retryAfterSeconds: 42 }));
		const response = await createRestaurantSearchHandler({
			apiKey: 'test-key',
			search,
			checkRateLimit
		})(post(validBody), '203.0.113.7');

		expect(response.status).toBe(429);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(response.headers.get('retry-after')).toBe('42');
		expect(checkRateLimit).toHaveBeenCalledWith('203.0.113.7');
		expect(search).not.toHaveBeenCalled();
	});

	it('rejects invalid input before calling the provider', async () => {
		const search = vi.fn();
		const response = await createRestaurantSearchHandler({ apiKey: 'server-key', search })(
			post({ location: { latitude: 100, longitude: 0 }, radiusMiles: 5 })
		);

		expect(response.status).toBe(400);
		expect(search).not.toHaveBeenCalled();
	});

	it('rejects non-JSON requests before calling the paid provider', async () => {
		const search = vi.fn();
		const response = await createRestaurantSearchHandler({ apiKey: 'server-key', search })(
			new Request('http://localhost/api/restaurants', {
				method: 'POST',
				headers: { 'content-type': 'text/plain' },
				body: JSON.stringify(validBody)
			})
		);

		expect(response.status).toBe(415);
		expect(search).not.toHaveBeenCalled();
	});

	it('returns an actionable error for an ambiguous manual area', async () => {
		const search = vi.fn().mockRejectedValue(new GoogleAreaResolutionError());
		const response = await createRestaurantSearchHandler({ apiKey: 'server-key', search })(
			post({ location: { area: 'Springfield' }, radiusMiles: 5 })
		);

		expect(response.status).toBe(422);
		expect(await response.json()).toEqual({
			configured: true,
			error: 'Enter a more specific U.S. city and state or ZIP code.'
		});
	});

	it('does not expose provider error details to the browser', async () => {
		const search = vi.fn().mockRejectedValue(new Error('secret provider response'));
		const response = await createRestaurantSearchHandler({ apiKey: 'server-key', search })(
			post(validBody)
		);

		expect(response.status).toBe(502);
		expect(await response.json()).toEqual({
			configured: true,
			error: 'Live restaurant search is temporarily unavailable.'
		});
	});
});
