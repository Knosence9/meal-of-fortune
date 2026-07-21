import { describe, expect, it } from 'vitest';

import {
	APP_CACHE_PREFIX,
	obsoleteAppCacheNames,
	shouldRefreshNavigationShell
} from './cache-policy';

describe('service-worker cache policy', () => {
	it('deletes only outdated Meal of Fortune caches', () => {
		const current = `${APP_CACHE_PREFIX}current`;

		expect(
			obsoleteAppCacheNames(
				[current, `${APP_CACHE_PREFIX}old`, 'another-application', 'analytics-cache'],
				current
			)
		).toEqual([`${APP_CACHE_PREFIX}old`]);
	});

	it('refreshes the offline shell only from the root navigation', () => {
		expect(shouldRefreshNavigationShell('https://meal.test/')).toBe(true);
		expect(shouldRefreshNavigationShell('https://meal.test/?party=2')).toBe(true);
		expect(shouldRefreshNavigationShell('https://meal.test/future-route')).toBe(false);
		expect(shouldRefreshNavigationShell('https://meal.test/robots.txt')).toBe(false);
	});
});
