/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';
import {
	APP_CACHE_PREFIX,
	obsoleteAppCacheNames,
	shouldRefreshNavigationShell
} from '$lib/service-worker/cache-policy';
import { networkFirstNavigation } from '$lib/service-worker/navigation';

const worker = self as unknown as ServiceWorkerGlobalScope;
const cacheName = `${APP_CACHE_PREFIX}${version}`;
const navigationShell = '/';
const shell = [navigationShell, ...build, ...files];

worker.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(cacheName)
			.then((cache) => cache.addAll(shell))
			.then(() => worker.skipWaiting())
	);
});

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(obsoleteAppCacheNames(keys, cacheName).map((key: string) => caches.delete(key)))
			)
			.then(() => worker.clients.claim())
	);
});

worker.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (
		event.request.method !== 'GET' ||
		url.origin !== worker.location.origin ||
		url.pathname.startsWith('/api/')
	) {
		return;
	}

	if (event.request.mode === 'navigate') {
		event.respondWith(
			networkFirstNavigation(event.request, navigationShell, {
				fetchRequest: (request: Request) => fetch(request),
				openCache: () => caches.open(cacheName),
				shouldRefreshShell: shouldRefreshNavigationShell
			})
		);
		return;
	}

	event.respondWith(
		caches
			.open(cacheName)
			.then((cache) => cache.match(event.request))
			.then((cached) => cached ?? fetch(event.request))
	);
});
