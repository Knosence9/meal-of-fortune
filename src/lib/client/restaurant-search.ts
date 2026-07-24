interface RestaurantSearchClientOptions {
	fetcher?: typeof fetch;
	timeoutMs?: number;
	signal?: AbortSignal;
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
