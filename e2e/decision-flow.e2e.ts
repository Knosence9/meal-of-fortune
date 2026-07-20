import { expect, test } from '@playwright/test';

test('turns shared cravings into one restaurant decision', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { name: /stop scrolling/i })).toBeVisible();
	const spinButton = page.locator('.spin-button');
	await spinButton.click();

	await expect(page.getByText('Fortune favors')).toBeVisible({ timeout: 3_000 });
	await expect(page.getByRole('link', { name: /open in maps/i })).toBeVisible();
	await expect(spinButton).toBeFocused();
});

test('clears a stale result when eligibility constraints change', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: /spin the wheel/i }).click();
	await expect(page.getByText('Fortune favors')).toBeVisible({ timeout: 3_000 });

	await page.locator('#radius').fill('1');

	await expect(page.getByText('Fortune favors')).not.toBeVisible();
});

test('locks eligibility controls while fortune is turning', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('button', { name: /spin the wheel/i }).click();

	await expect(page.locator('#radius')).toBeDisabled();
	await expect(page.getByRole('checkbox', { name: /open now/i })).toBeDisabled();
	await expect(page.getByRole('button', { name: '$', exact: true })).toBeDisabled();
});

test('shows a visible focus ring on the custom open-now switch', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('checkbox', { name: /open now/i }).focus();

	await expect(page.locator('.switch')).toHaveCSS('outline-style', 'solid');
});

test('uses a dual-contrast global keyboard focus indicator', async ({ page }) => {
	await page.goto('/');
	const spinButton = page.getByRole('button', { name: /spin the wheel/i });
	await spinButton.focus();

	await expect(spinButton).toHaveCSS('outline-color', 'rgb(255, 255, 255)');
	await expect(spinButton).toHaveCSS('box-shadow', /rgb\(36, 28, 24\)/);
});

test('publishes orientation-neutral PWA metadata with a dedicated maskable icon', async ({
	page
}) => {
	await page.goto('/');
	const manifest = await page.evaluate(async () => (await fetch('/manifest.webmanifest')).json());
	const maskable = manifest.icons.find((icon: { purpose?: string }) => icon.purpose === 'maskable');

	expect(manifest.orientation).toBeUndefined();
	expect(maskable?.src).toBe('/meal-wheel-maskable-512.png');
	expect(maskable?.purpose).toBe('maskable');
});

test('keeps a manually selected area when an older geolocation request finishes', async ({
	page
}) => {
	await page.addInitScript(() => {
		Object.defineProperty(navigator, 'geolocation', {
			configurable: true,
			value: {
				getCurrentPosition(success: PositionCallback) {
					(
						window as typeof window & { resolvePendingLocation?: () => void }
					).resolvePendingLocation = () => success({} as GeolocationPosition);
				}
			}
		});
	});
	await page.goto('/');
	await page.getByRole('button', { name: /use my location/i }).click();
	await page.getByLabel(/neighborhood, city, or zip/i).fill('Midtown');
	await page.getByRole('button', { name: 'Set', exact: true }).click();

	await page.evaluate(() =>
		(window as typeof window & { resolvePendingLocation?: () => void }).resolvePendingLocation?.()
	);

	await expect(page.getByText('Midtown', { exact: true })).toBeVisible();
});

test('uses only its own versioned cache for offline navigation', async ({ page, context }) => {
	await page.goto('/robots.txt');
	await page.evaluate(async () => {
		const unrelated = await caches.open('another-application');
		await unrelated.put(
			'/',
			new Response('<h1>Foreign cache entry</h1>', {
				headers: { 'content-type': 'text/html' }
			})
		);
	});
	await page.goto('/');
	await page.evaluate(() => navigator.serviceWorker.ready);

	await context.setOffline(true);
	await page.reload({ waitUntil: 'domcontentloaded' });

	await expect(page.getByRole('heading', { name: /stop scrolling/i })).toBeVisible();
});

test('does not replace the root shell with another navigation response', async ({
	page,
	context
}) => {
	await page.goto('/');
	await page.evaluate(() => navigator.serviceWorker.ready);
	await page.goto('/robots.txt');

	await context.setOffline(true);
	await page.goto('/', { waitUntil: 'domcontentloaded' });

	await expect(page.getByRole('heading', { name: /stop scrolling/i })).toBeVisible();
});

test('reopens the installed application shell offline', async ({ page, context }) => {
	await page.goto('/');
	await page.evaluate(() => navigator.serviceWorker.ready);

	await context.setOffline(true);
	await page.reload({ waitUntil: 'domcontentloaded' });

	await expect(page.getByRole('heading', { name: /stop scrolling/i })).toBeVisible();
});
