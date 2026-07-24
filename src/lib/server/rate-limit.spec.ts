import { describe, expect, it } from 'vitest';

import { createPerClientRateLimiter } from './rate-limit';

describe('createPerClientRateLimiter', () => {
	it('rejects requests beyond the client limit and reports retry timing', () => {
		let now = 1_000;
		const limiter = createPerClientRateLimiter({ limit: 3, windowMs: 60_000, now: () => now });

		expect(limiter.check('client-a').allowed).toBe(true);
		expect(limiter.check('client-a').allowed).toBe(true);
		expect(limiter.check('client-a').allowed).toBe(true);
		expect(limiter.check('client-a')).toEqual({ allowed: false, retryAfterSeconds: 60 });

		now += 30_000;
		expect(limiter.check('client-a')).toEqual({ allowed: false, retryAfterSeconds: 30 });
	});

	it('isolates clients and resets an expired window', () => {
		let now = 1_000;
		const limiter = createPerClientRateLimiter({ limit: 1, windowMs: 60_000, now: () => now });

		expect(limiter.check('client-a').allowed).toBe(true);
		expect(limiter.check('client-a').allowed).toBe(false);
		expect(limiter.check('client-b').allowed).toBe(true);

		now += 60_000;
		expect(limiter.check('client-a').allowed).toBe(true);
	});
});
