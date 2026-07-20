/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';
import {
	APP_CACHE_PREFIX,
	obsoleteAppCacheNames,
	shouldRefreshNavigationShell
} from '$lib/service-worker/cache-policy';

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
				Promise.all(obsoleteAppCacheNames(keys, cacheName).map((key) => caches.delete(key)))
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
		event.respondWith(networkFirstNavigation(event.request));
		return;
	}

	event.respondWith(
		caches
			.open(cacheName)
			.then((cache) => cache.match(event.request))
			.then((cached) => cached ?? fetch(event.request))
	);
});

async function networkFirstNavigation(request: Request): Promise<Response> {
	try {
		const response = await fetch(request);
		if (response.ok && shouldRefreshNavigationShell(request.url)) {
			const cache = await caches.open(cacheName);
			await cache.put(navigationShell, response.clone());
		}
		return response;
	} catch {
		const cache = await caches.open(cacheName);
		return (await cache.match(navigationShell)) ?? Response.error();
	}
}
