export interface NavigationCache {
	match(request: RequestInfo | URL): Promise<Response | undefined>;
	put(request: RequestInfo | URL, response: Response): Promise<void>;
}

export interface NavigationDependencies {
	fetchRequest(request: Request): Promise<Response>;
	openCache(): Promise<NavigationCache>;
	shouldRefreshShell(url: string): boolean;
}

export async function networkFirstNavigation(
	request: Request,
	navigationShell: string,
	dependencies: NavigationDependencies
): Promise<Response> {
	let response: Response;
	try {
		response = await dependencies.fetchRequest(request);
	} catch {
		try {
			const cache = await dependencies.openCache();
			return (await cache.match(navigationShell)) ?? Response.error();
		} catch {
			return Response.error();
		}
	}

	if (response.ok && dependencies.shouldRefreshShell(request.url)) {
		try {
			const cache = await dependencies.openCache();
			await cache.put(navigationShell, response.clone());
		} catch {
			// A cache refresh is best-effort; never discard a successful network response.
		}
	}

	return response;
}
