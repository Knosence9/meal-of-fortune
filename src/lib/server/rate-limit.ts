export interface RateLimitResult {
	allowed: boolean;
	retryAfterSeconds: number;
}

interface RateLimiterOptions {
	limit: number;
	windowMs: number;
	now?: () => number;
	maxClients?: number;
}

interface ClientWindow {
	count: number;
	resetAt: number;
}

export function createPerClientRateLimiter({
	limit,
	windowMs,
	now = Date.now,
	maxClients = 4_096
}: RateLimiterOptions): { check(clientId: string): RateLimitResult } {
	const clients = new Map<string, ClientWindow>();

	return {
		check(clientId: string): RateLimitResult {
			const currentTime = now();
			let window = clients.get(clientId);

			if (!window || currentTime >= window.resetAt) {
				if (!window && clients.size >= maxClients) {
					pruneClients(clients, currentTime, maxClients);
				}
				window = { count: 0, resetAt: currentTime + windowMs };
				clients.set(clientId, window);
			}

			const retryAfterSeconds = Math.max(1, Math.ceil((window.resetAt - currentTime) / 1_000));
			if (window.count >= limit) {
				return { allowed: false, retryAfterSeconds };
			}

			window.count += 1;
			return { allowed: true, retryAfterSeconds };
		}
	};
}

function pruneClients(
	clients: Map<string, ClientWindow>,
	currentTime: number,
	maxClients: number
): void {
	for (const [clientId, window] of clients) {
		if (currentTime >= window.resetAt) clients.delete(clientId);
	}

	while (clients.size >= maxClients) {
		const oldestClient = clients.keys().next().value;
		if (oldestClient === undefined) break;
		clients.delete(oldestClient);
	}
}
