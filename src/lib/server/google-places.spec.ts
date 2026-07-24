import { describe, expect, it, vi } from 'vitest';

import { GoogleAreaResolutionError, searchGoogleRestaurants } from './google-places';

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' }
	});
}

function isAborted(signal: AbortSignal | null): boolean {
	return signal?.aborted === true;
}

function abortReason(signal: AbortSignal | null): unknown {
	return signal?.reason;
}

describe('searchGoogleRestaurants', () => {
	it('requests rating-bearing nearby fields and maps a Google restaurant candidate', async () => {
		const fetcher = vi.fn<typeof fetch>(async () =>
			jsonResponse({
				places: [
					{
						id: 'google-place-1',
						displayName: { text: 'Verde Real' },
						formattedAddress: '10 Main Street',
						location: { latitude: 33.755, longitude: -84.39 },
						businessStatus: 'OPERATIONAL',
						types: ['mexican_restaurant', 'restaurant'],
						currentOpeningHours: { openNow: true },
						priceLevel: 'PRICE_LEVEL_MODERATE',
						rating: 4.6,
						userRatingCount: 327,
						googleMapsUri: 'https://maps.google.com/?cid=123'
					}
				]
			})
		);

		const restaurants = await searchGoogleRestaurants(
			{
				location: { latitude: 33.75, longitude: -84.39 },
				radiusMiles: 5
			},
			{ apiKey: 'test-key', fetcher }
		);

		expect(fetcher).toHaveBeenCalledOnce();
		const [url, init] = fetcher.mock.calls[0];
		expect(url).toBe('https://places.googleapis.com/v1/places:searchNearby');
		expect(init?.headers).toMatchObject({
			'X-Goog-Api-Key': 'test-key'
		});
		expect(String((init?.headers as Record<string, string>)['X-Goog-FieldMask'])).toContain(
			'places.rating'
		);
		expect(String((init?.headers as Record<string, string>)['X-Goog-FieldMask'])).toContain(
			'places.userRatingCount'
		);
		expect(restaurants).toEqual([
			expect.objectContaining({
				id: 'google-place-1',
				name: 'Verde Real',
				address: '10 Main Street',
				cuisines: ['mexican'],
				traits: [],
				priceLevel: 2,
				isOpen: true,
				rating: 4.6,
				ratingCount: 327,
				mapsUri: 'https://maps.google.com/?cid=123',
				source: 'google'
			})
		]);
		expect(restaurants[0].distanceMiles).toBeGreaterThan(0.3);
		expect(restaurants[0].distanceMiles).toBeLessThan(0.4);
	});

	it('excludes businesses Google marks closed', async () => {
		const fetcher = vi.fn<typeof fetch>(async () =>
			jsonResponse({
				places: [
					{
						id: 'closed-place',
						displayName: { text: 'Closed Forever' },
						formattedAddress: '1 Old Road',
						location: { latitude: 33.75, longitude: -84.39 },
						businessStatus: 'CLOSED_PERMANENTLY',
						types: ['restaurant']
					}
				]
			})
		);

		const restaurants = await searchGoogleRestaurants(
			{ location: { latitude: 33.75, longitude: -84.39 }, radiusMiles: 5 },
			{ apiKey: 'test-key', fetcher }
		);

		expect(restaurants).toEqual([]);
		expect(
			String((fetcher.mock.calls[0][1]?.headers as Record<string, string>)['X-Goog-FieldMask'])
		).toContain('places.businessStatus');
	});

	it('drops a Maps URI that is not hosted by Google', async () => {
		const fetcher = vi.fn<typeof fetch>(async () =>
			jsonResponse({
				places: [
					{
						id: 'unsafe-link-place',
						displayName: { text: 'Safe Restaurant' },
						formattedAddress: '2 Main Road',
						location: { latitude: 33.75, longitude: -84.39 },
						businessStatus: 'OPERATIONAL',
						types: ['restaurant'],
						googleMapsUri: 'https://evilgoogle.com/steal'
					}
				]
			})
		);

		const restaurants = await searchGoogleRestaurants(
			{ location: { latitude: 33.75, longitude: -84.39 }, radiusMiles: 5 },
			{ apiKey: 'test-key', fetcher }
		);

		expect(restaurants[0].mapsUri).toBeUndefined();
	});

	it('geocodes a manual area before applying a nearby radius search', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				jsonResponse({
					status: 'OK',
					results: [
						{
							formatted_address: 'Atlanta, GA 30318, USA',
							geometry: { location: { lat: 33.78, lng: -84.41 } },
							address_components: [
								{ short_name: '30318', types: ['postal_code'] },
								{ short_name: 'US', types: ['country'] }
							]
						}
					]
				})
			)
			.mockResolvedValueOnce(jsonResponse({ places: [] }));

		await searchGoogleRestaurants(
			{ location: { area: '30318' }, radiusMiles: 4 },
			{ apiKey: 'test-key', fetcher }
		);

		expect(fetcher).toHaveBeenCalledTimes(2);
		const [geocodeUrl] = fetcher.mock.calls[0];
		expect(String(geocodeUrl)).toContain('https://maps.googleapis.com/maps/api/geocode/json?');
		expect(String(geocodeUrl)).toContain('address=30318');
		expect(String(geocodeUrl)).toContain('components=country%3AUS');
		expect(String(geocodeUrl)).toContain('region=us');
		expect(String(geocodeUrl)).toContain('key=test-key');
		const [nearbyUrl, nearbyInit] = fetcher.mock.calls[1];
		expect(nearbyUrl).toBe('https://places.googleapis.com/v1/places:searchNearby');
		expect(JSON.parse(String(nearbyInit?.body))).toMatchObject({
			locationRestriction: {
				circle: {
					center: { latitude: 33.78, longitude: -84.41 },
					radius: 6437.376
				}
			}
		});
	});

	it('rejects an ambiguous manual area before nearby search', async () => {
		const geocodeResult = (latitude: number) => ({
			formatted_address: 'Springfield, USA',
			geometry: { location: { lat: latitude, lng: -89.64 } },
			address_components: [{ short_name: 'US', types: ['country'] }]
		});
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				jsonResponse({ status: 'OK', results: [geocodeResult(39.78), geocodeResult(44.05)] })
			)
			.mockResolvedValueOnce(jsonResponse({ places: [] }));

		await expect(
			searchGoogleRestaurants(
				{ location: { area: 'Springfield' }, radiusMiles: 4 },
				{ apiKey: 'test-key', fetcher }
			)
		).rejects.toThrow(/more specific/i);
		expect(fetcher).toHaveBeenCalledOnce();
	});

	it('rejects a partial manual-area match before nearby search', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				jsonResponse({
					status: 'OK',
					results: [
						{
							partial_match: true,
							formatted_address: 'Midtown, Atlanta, GA, USA',
							geometry: { location: { lat: 33.78, lng: -84.41 } },
							address_components: [{ short_name: 'US', types: ['country'] }]
						}
					]
				})
			)
			.mockResolvedValueOnce(jsonResponse({ places: [] }));

		await expect(
			searchGoogleRestaurants(
				{ location: { area: 'Midtow' }, radiusMiles: 4 },
				{ apiKey: 'test-key', fetcher }
			)
		).rejects.toThrow(/more specific/i);
		expect(fetcher).toHaveBeenCalledOnce();
	});

	it('keeps geocoder quota failures classified as provider errors', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(jsonResponse({ status: 'OVER_QUERY_LIMIT', results: [] }));

		const pending = searchGoogleRestaurants(
			{ location: { area: 'Dallas, TX' }, radiusMiles: 4 },
			{ apiKey: 'test-key', fetcher }
		);
		await expect(pending).rejects.toThrow(/OVER_QUERY_LIMIT/);
		await expect(pending).rejects.not.toBeInstanceOf(GoogleAreaResolutionError);
		expect(fetcher).toHaveBeenCalledOnce();
	});

	it('rejects a broad state-only geocode before nearby search', async () => {
		const fetcher = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				jsonResponse({
					status: 'OK',
					results: [
						{
							formatted_address: 'Georgia, USA',
							geometry: { location: { lat: 32.68, lng: -83.22 } },
							address_components: [
								{ short_name: 'GA', types: ['administrative_area_level_1'] },
								{ short_name: 'US', types: ['country'] }
							]
						}
					]
				})
			)
			.mockResolvedValueOnce(jsonResponse({ places: [] }));

		await expect(
			searchGoogleRestaurants(
				{ location: { area: 'Georgia' }, radiusMiles: 4 },
				{ apiKey: 'test-key', fetcher }
			)
		).rejects.toBeInstanceOf(GoogleAreaResolutionError);
		expect(fetcher).toHaveBeenCalledOnce();
	});

	it('drops malformed aggregate rating data', async () => {
		const fetcher = vi.fn<typeof fetch>(async () =>
			jsonResponse({
				places: [
					{
						id: 'bad-rating-place',
						displayName: { text: 'Rating Glitch' },
						location: { latitude: 33.75, longitude: -84.39 },
						businessStatus: 'OPERATIONAL',
						types: ['restaurant'],
						rating: 6,
						userRatingCount: -2
					}
				]
			})
		);

		const [restaurant] = await searchGoogleRestaurants(
			{ location: { latitude: 33.75, longitude: -84.39 }, radiusMiles: 5 },
			{ apiKey: 'test-key', fetcher }
		);

		expect(restaurant.priceLevel).toBeNull();
		expect(restaurant.rating).toBeUndefined();
		expect(restaurant.ratingCount).toBeUndefined();
	});

	it('propagates caller cancellation to the active provider request', async () => {
		let providerSignal: AbortSignal | null = null;
		const fetcher = vi.fn<typeof fetch>((_url, init) => {
			const signal = init?.signal ?? null;
			providerSignal = signal;
			if (signal?.aborted) return Promise.reject(signal.reason);
			return new Promise<Response>((_resolve, reject) => {
				signal?.addEventListener('abort', () => reject(signal.reason));
			});
		});
		const caller = new AbortController();
		const callerReason = new DOMException('Caller stopped waiting.', 'AbortError');
		const pending = searchGoogleRestaurants(
			{ location: { latitude: 33.75, longitude: -84.39 }, radiusMiles: 5 },
			{ apiKey: 'test-key', fetcher, signal: caller.signal, timeoutMs: 100 }
		);

		caller.abort(callerReason);
		await expect(pending).rejects.toBe(callerReason);
		expect(abortReason(providerSignal)).toBe(callerReason);
	});

	it('uses one overall deadline across geocoding and nearby search', async () => {
		const providerSignals: AbortSignal[] = [];
		const fetcher = vi.fn<typeof fetch>(async (_url, init) => {
			if (init?.signal) providerSignals.push(init.signal);
			if (providerSignals.length === 1) {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return jsonResponse({
					status: 'OK',
					results: [
						{
							formatted_address: 'Atlanta, GA 30318, USA',
							geometry: { location: { lat: 33.78, lng: -84.41 } },
							address_components: [
								{ short_name: '30318', types: ['postal_code'] },
								{ short_name: 'US', types: ['country'] }
							]
						}
					]
				});
			}
			return new Promise<Response>((_resolve, reject) => {
				init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
			});
		});

		await expect(
			searchGoogleRestaurants(
				{ location: { area: '30318' }, radiusMiles: 4 },
				{ apiKey: 'test-key', fetcher, timeoutMs: 20 }
			)
		).rejects.toThrow();
		expect(providerSignals).toHaveLength(2);
		expect(providerSignals[1]).toBe(providerSignals[0]);
	});

	it('aborts a stalled provider request after the configured timeout', async () => {
		let providerSignal: AbortSignal | null = null;
		const fetcher = vi.fn<typeof fetch>((_url, init) => {
			providerSignal = init?.signal ?? null;
			return new Promise<Response>((_resolve, reject) => {
				providerSignal?.addEventListener('abort', () => reject(providerSignal?.reason));
			});
		});

		await expect(
			searchGoogleRestaurants(
				{ location: { latitude: 33.75, longitude: -84.39 }, radiusMiles: 5 },
				{ apiKey: 'test-key', fetcher, timeoutMs: 5 }
			)
		).rejects.toThrow();
		expect(providerSignal).not.toBeNull();
		expect(isAborted(providerSignal)).toBe(true);
	});
});
