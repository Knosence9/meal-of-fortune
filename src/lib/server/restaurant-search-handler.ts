import {
	GoogleAreaResolutionError,
	searchGoogleRestaurants,
	type GooglePlacesDependencies,
	type GoogleRestaurantCandidate,
	type GoogleRestaurantSearch
} from './google-places';
import { parseRestaurantSearchRequest } from './restaurant-search-request';

type RestaurantSearch = (
	input: GoogleRestaurantSearch,
	dependencies: GooglePlacesDependencies
) => Promise<GoogleRestaurantCandidate[]>;

export interface RestaurantSearchHandlerDependencies {
	apiKey: string;
	search?: RestaurantSearch;
	checkRateLimit?: (clientId: string) => { allowed: boolean; retryAfterSeconds: number };
}

export function createRestaurantSearchHandler({
	apiKey,
	search = searchGoogleRestaurants,
	checkRateLimit
}: RestaurantSearchHandlerDependencies): (
	request: Request,
	clientId?: string
) => Promise<Response> {
	return async (request: Request, clientId = 'unknown-client'): Promise<Response> => {
		if (!apiKey.trim()) {
			return jsonResponse(
				{ configured: false, error: 'Live restaurant search is not configured.' },
				503
			);
		}

		const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
		if (contentType !== 'application/json') {
			return jsonResponse(
				{ configured: true, error: 'Content-Type must be application/json.' },
				415
			);
		}

		let input: GoogleRestaurantSearch;
		try {
			input = parseRestaurantSearchRequest(await request.json());
		} catch {
			return jsonResponse({ configured: true, error: 'Invalid restaurant search request.' }, 400);
		}

		const rateLimit = checkRateLimit?.(clientId);
		if (rateLimit && !rateLimit.allowed) {
			return jsonResponse(
				{ configured: true, error: 'Too many live restaurant searches. Please try again shortly.' },
				429,
				{ 'retry-after': String(rateLimit.retryAfterSeconds) }
			);
		}

		try {
			const restaurants = await search(input, { apiKey, signal: request.signal });
			return jsonResponse({ configured: true, restaurants }, 200);
		} catch (error) {
			if (error instanceof GoogleAreaResolutionError) {
				return jsonResponse({ configured: true, error: error.message }, 422);
			}
			return jsonResponse(
				{ configured: true, error: 'Live restaurant search is temporarily unavailable.' },
				502
			);
		}
	};
}

function jsonResponse(body: unknown, status: number, extraHeaders: HeadersInit = {}): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
			...extraHeaders
		}
	});
}
