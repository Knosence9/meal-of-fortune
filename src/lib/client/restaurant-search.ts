interface RestaurantSearchClientOptions {
	fetcher?: typeof fetch;
	timeoutMs?: number;
	signal?: AbortSignal;
}

export function isValidLiveRestaurant(value: unknown): boolean {
	if (!value || typeof value !== 'object') return false;
	const restaurant = value as Record<string, unknown>;
	const ratingAbsent = restaurant.rating === undefined && restaurant.ratingCount === undefined;
	const ratingValid =
		typeof restaurant.rating === 'number' &&
		Number.isFinite(restaurant.rating) &&
		restaurant.rating >= 0 &&
		restaurant.rating <= 5 &&
		typeof restaurant.ratingCount === 'number' &&
		Number.isInteger(restaurant.ratingCount) &&
		restaurant.ratingCount >= 0;
	const priceValid =
		restaurant.priceLevel === null ||
		(typeof restaurant.priceLevel === 'number' &&
			Number.isInteger(restaurant.priceLevel) &&
			restaurant.priceLevel >= 0 &&
			restaurant.priceLevel <= 4);

	return (
		restaurant.source === 'google' &&
		typeof restaurant.id === 'string' &&
		typeof restaurant.name === 'string' &&
		Array.isArray(restaurant.cuisines) &&
		restaurant.cuisines.every((cuisine) => typeof cuisine === 'string') &&
		Array.isArray(restaurant.traits) &&
		restaurant.traits.every((trait) => typeof trait === 'string') &&
		typeof restaurant.distanceMiles === 'number' &&
		Number.isFinite(restaurant.distanceMiles) &&
		restaurant.distanceMiles >= 0 &&
		priceValid &&
		typeof restaurant.isOpen === 'boolean' &&
		typeof restaurant.address === 'string' &&
		(ratingAbsent || ratingValid) &&
		(restaurant.mapsUri === undefined || typeof restaurant.mapsUri === 'string')
	);
}

export async function requestLiveRestaurants(
	body: unknown,
	{ fetcher = fetch, timeoutMs = 12_000, signal }: RestaurantSearchClientOptions = {}
): Promise<Response> {
	const controller = new AbortController();
	const abortFromCaller = (): void => controller.abort(signal?.reason);
	if (signal?.aborted) abortFromCaller();
	else signal?.addEventListener('abort', abortFromCaller, { once: true });

	const timeout = setTimeout(
		() => controller.abort(new DOMException('Live restaurant search timed out.', 'TimeoutError')),
		timeoutMs
	);

	try {
		return await fetcher('/api/restaurants', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body),
			signal: controller.signal
		});
	} finally {
		clearTimeout(timeout);
		signal?.removeEventListener('abort', abortFromCaller);
	}
}
