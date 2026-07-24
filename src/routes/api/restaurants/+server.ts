import { env } from '$env/dynamic/private';
import { createPerClientRateLimiter } from '$lib/server/rate-limit';
import { createRestaurantSearchHandler } from '$lib/server/restaurant-search-handler';

import type { RequestHandler } from './$types';

const liveSearchLimiter = createPerClientRateLimiter({ limit: 3, windowMs: 60_000 });

export const POST: RequestHandler = async ({ request, getClientAddress }) =>
	createRestaurantSearchHandler({
		apiKey: env.GOOGLE_PLACES_API_KEY ?? '',
		checkRateLimit: (clientId) => liveSearchLimiter.check(clientId)
	})(request, getClientAddress());
