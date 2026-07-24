import type { GoogleRestaurantSearch } from './google-places';

export function parseRestaurantSearchRequest(value: unknown): GoogleRestaurantSearch {
	if (!isRecord(value)) throw new Error('request body must be an object');
	const radiusMiles = value.radiusMiles;
	if (
		typeof radiusMiles !== 'number' ||
		!Number.isFinite(radiusMiles) ||
		radiusMiles < 1 ||
		radiusMiles > 10
	) {
		throw new Error('radius must be between 1 and 10 miles');
	}

	const location = value.location;
	if (!isRecord(location)) throw new Error('location must be provided');
	if (typeof location.area === 'string') {
		const area = location.area.trim();
		if (area.length < 1 || area.length > 120) throw new Error('area must be 1 to 120 characters');
		if ('latitude' in location || 'longitude' in location) {
			throw new Error('location must use either coordinates or area');
		}
		return { location: { area }, radiusMiles };
	}

	const latitude = location.latitude;
	const longitude = location.longitude;
	if (
		typeof latitude !== 'number' ||
		!Number.isFinite(latitude) ||
		latitude < -90 ||
		latitude > 90
	) {
		throw new Error('latitude must be between -90 and 90');
	}
	if (
		typeof longitude !== 'number' ||
		!Number.isFinite(longitude) ||
		longitude < -180 ||
		longitude > 180
	) {
		throw new Error('longitude must be between -180 and 180');
	}
	return { location: { latitude, longitude }, radiusMiles };
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
