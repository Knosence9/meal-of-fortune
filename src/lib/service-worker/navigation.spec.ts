import { describe, expect, it, vi } from 'vitest';

import { networkFirstNavigation } from './navigation';

const request = new Request('https://meal-of-fortune.example/');

describe('networkFirstNavigation', () => {
	it('returns the cached shell when the network request fails', async () => {
		const cached = new Response('cached shell', { status: 200 });
		const fetchRequest = vi.fn().mockRejectedValue(new Error('offline'));
		const match = vi.fn().mockResolvedValue(cached);

		const result = await networkFirstNavigation(request, '/', {
			fetchRequest,
			openCache: vi.fn().mockResolvedValue({ match, put: vi.fn() }),
			shouldRefreshShell: () => true
		});

		expect(fetchRequest).toHaveBeenCalledOnce();
		expect(fetchRequest).toHaveBeenCalledWith(request);
		expect(match).toHaveBeenCalledWith('/');
		expect(result).toBe(cached);
		expect(await result.text()).toBe('cached shell');
	});

	it('returns a fresh network response when opening the cache fails', async () => {
		const fresh = new Response('fresh shell', { status: 200 });

		const result = await networkFirstNavigation(request, '/', {
			fetchRequest: vi.fn().mockResolvedValue(fresh),
			openCache: vi.fn().mockRejectedValue(new Error('storage unavailable')),
			shouldRefreshShell: () => true
		});

		expect(result).toBe(fresh);
		expect(await result.text()).toBe('fresh shell');
	});

	it('returns a fresh network response when writing the cache fails', async () => {
		const fresh = new Response('fresh shell', { status: 200 });
		const put = vi.fn().mockRejectedValue(new Error('quota exceeded'));

		const result = await networkFirstNavigation(request, '/', {
			fetchRequest: vi.fn().mockResolvedValue(fresh),
			openCache: vi.fn().mockResolvedValue({ match: vi.fn(), put }),
			shouldRefreshShell: () => true
		});

		expect(put).toHaveBeenCalledOnce();
		expect(result).toBe(fresh);
		expect(await result.text()).toBe('fresh shell');
	});
});
