export const APP_CACHE_PREFIX = 'meal-of-fortune-';

export function obsoleteAppCacheNames(cacheNames: string[], currentCacheName: string): string[] {
	return cacheNames.filter(
		(cacheName) => cacheName.startsWith(APP_CACHE_PREFIX) && cacheName !== currentCacheName
	);
}

export function shouldRefreshNavigationShell(requestUrl: string): boolean {
	return new URL(requestUrl).pathname === '/';
}
