import type { RestaurantCandidate } from '$lib/domain/decision';

const nearbySearchUrl = 'https://places.googleapis.com/v1/places:searchNearby';
const nearbyFieldMask = [
	'places.id',
	'places.displayName',
	'places.formattedAddress',
	'places.location',
	'places.businessStatus',
	'places.types',
	'places.currentOpeningHours',
	'places.priceLevel',
	'places.rating',
	'places.userRatingCount',
	'places.googleMapsUri'
].join(',');

export class GoogleAreaResolutionError extends Error {
	constructor() {
		super('Enter a more specific U.S. city and state or ZIP code.');
		this.name = 'GoogleAreaResolutionError';
	}
}

export interface GoogleRestaurantCandidate extends RestaurantCandidate {
	source: 'google';
	address: string;
	rating?: number;
	ratingCount?: number;
	mapsUri?: string;
}

export type GoogleSearchLocation = { latitude: number; longitude: number } | { area: string };

export interface GoogleRestaurantSearch {
	location: GoogleSearchLocation;
	radiusMiles: number;
}

export interface GooglePlacesDependencies {
	apiKey: string;
	fetcher?: typeof fetch;
	timeoutMs?: number;
	signal?: AbortSignal;
}

interface GooglePlace {
	id?: string;
	displayName?: { text?: string };
	formattedAddress?: string;
	location?: { latitude?: number; longitude?: number };
	businessStatus?: string;
	types?: string[];
	currentOpeningHours?: { openNow?: boolean };
	priceLevel?: string;
	rating?: number;
	userRatingCount?: number;
	googleMapsUri?: string;
}

export async function searchGoogleRestaurants(
	input: GoogleRestaurantSearch,
	{ apiKey, fetcher = fetch, timeoutMs = 8_000, signal }: GooglePlacesDependencies
): Promise<GoogleRestaurantCandidate[]> {
	const deadline = AbortSignal.timeout(timeoutMs);
	const providerSignal = signal ? AbortSignal.any([signal, deadline]) : deadline;
	const origin = await resolveSearchOrigin(input.location, apiKey, fetcher, providerSignal);
	const response = await fetcher(nearbySearchUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Goog-Api-Key': apiKey,
			'X-Goog-FieldMask': nearbyFieldMask
		},
		body: JSON.stringify({
			includedTypes: ['restaurant'],
			maxResultCount: 20,
			rankPreference: 'POPULARITY',
			locationRestriction: {
				circle: {
					center: origin,
					radius: milesToMeters(input.radiusMiles)
				}
			}
		}),
		signal: providerSignal
	});

	if (!response.ok) {
		throw new Error(`Google Places search failed with HTTP ${response.status}`);
	}

	const payload = (await response.json()) as { places?: GooglePlace[] };
	return (payload.places ?? []).flatMap((place) => {
		if (place.businessStatus?.startsWith('CLOSED_')) return [];
		const latitude = place.location?.latitude;
		const longitude = place.location?.longitude;
		const name = place.displayName?.text?.trim();
		if (!place.id || !name || latitude === undefined || longitude === undefined) return [];
		const aggregateRating = normalizeAggregateRating(place.rating, place.userRatingCount);

		return [
			{
				id: place.id,
				name,
				address: place.formattedAddress?.trim() ?? '',
				cuisines: cuisinesFromGoogleTypes(place.types ?? []),
				traits: [],
				distanceMiles: haversineMiles(origin, { latitude, longitude }),
				priceLevel: googlePriceLevel(place.priceLevel),
				isOpen: place.currentOpeningHours?.openNow === true,
				...aggregateRating,
				mapsUri: safeGoogleMapsUri(place.googleMapsUri),
				source: 'google' as const
			}
		];
	});
}

async function resolveSearchOrigin(
	location: GoogleSearchLocation,
	apiKey: string,
	fetcher: typeof fetch,
	signal: AbortSignal
): Promise<{ latitude: number; longitude: number }> {
	if ('latitude' in location) return location;

	const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
	url.searchParams.set('address', location.area);
	url.searchParams.set('components', 'country:US');
	url.searchParams.set('region', 'us');
	url.searchParams.set('key', apiKey);
	const response = await fetcher(url, { signal });
	if (!response.ok) throw new Error(`Google Geocoding failed with HTTP ${response.status}`);
	const payload = (await response.json()) as {
		status?: string;
		results?: Array<{
			partial_match?: boolean;
			formatted_address?: string;
			address_components?: Array<{ short_name?: string; types?: string[] }>;
			geometry?: { location?: { lat?: number; lng?: number } };
		}>;
	};
	const results = payload.results ?? [];
	if (payload.status !== 'OK') {
		throw new Error(`Google Geocoding failed with status ${payload.status ?? 'UNKNOWN'}`);
	}
	const result = results[0];
	const latitude = result?.geometry?.location?.lat;
	const longitude = result?.geometry?.location?.lng;
	const componentTypes = new Set(
		result?.address_components?.flatMap((component) => component.types ?? []) ?? []
	);
	const country = result?.address_components?.find((component) =>
		component.types?.includes('country')
	)?.short_name;
	const isSpecificArea =
		componentTypes.has('postal_code') ||
		(componentTypes.has('locality') && componentTypes.has('administrative_area_level_1'));
	if (
		results.length !== 1 ||
		result?.partial_match === true ||
		!result?.formatted_address?.trim() ||
		country !== 'US' ||
		!isSpecificArea ||
		!isValidCoordinate(latitude, -90, 90) ||
		!isValidCoordinate(longitude, -180, 180)
	) {
		throw new GoogleAreaResolutionError();
	}
	return { latitude, longitude };
}

function isValidCoordinate(value: unknown, minimum: number, maximum: number): value is number {
	return (
		typeof value === 'number' && Number.isFinite(value) && value >= minimum && value <= maximum
	);
}

function cuisinesFromGoogleTypes(types: string[]): string[] {
	return types
		.filter((type) => type.endsWith('_restaurant') && type !== 'restaurant')
		.map((type) => type.slice(0, -'_restaurant'.length).replaceAll('_', ' '));
}

function googlePriceLevel(value?: string): number {
	return (
		{
			PRICE_LEVEL_FREE: 0,
			PRICE_LEVEL_INEXPENSIVE: 1,
			PRICE_LEVEL_MODERATE: 2,
			PRICE_LEVEL_EXPENSIVE: 3,
			PRICE_LEVEL_VERY_EXPENSIVE: 4
		}[value ?? ''] ?? 0
	);
}

function normalizeAggregateRating(
	rating: unknown,
	ratingCount: unknown
): { rating?: number; ratingCount?: number } {
	if (
		typeof rating !== 'number' ||
		!Number.isFinite(rating) ||
		rating < 0 ||
		rating > 5 ||
		typeof ratingCount !== 'number' ||
		!Number.isInteger(ratingCount) ||
		ratingCount < 0
	) {
		return {};
	}
	return { rating, ratingCount };
}

function safeGoogleMapsUri(value?: string): string | undefined {
	if (!value) return undefined;
	try {
		const url = new URL(value);
		return url.protocol === 'https:' &&
			(url.hostname === 'google.com' || url.hostname.endsWith('.google.com'))
			? url.toString()
			: undefined;
	} catch {
		return undefined;
	}
}

function milesToMeters(miles: number): number {
	return miles * 1609.344;
}

function haversineMiles(
	from: { latitude: number; longitude: number },
	to: { latitude: number; longitude: number }
): number {
	const earthRadiusMiles = 3958.7613;
	const latitudeDelta = radians(to.latitude - from.latitude);
	const longitudeDelta = radians(to.longitude - from.longitude);
	const fromLatitude = radians(from.latitude);
	const toLatitude = radians(to.latitude);
	const a =
		Math.sin(latitudeDelta / 2) ** 2 +
		Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
	return earthRadiusMiles * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function radians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}
