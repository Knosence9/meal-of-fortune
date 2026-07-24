import { expect, test } from '@playwright/test';

test('shows the deployed application version on every page', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByText('Version 0.2.1', { exact: true })).toBeVisible();

	await page.goto('/privacy');
	await expect(page.getByText('Version 0.2.1', { exact: true })).toBeVisible();
});

test('turns shared cravings into one restaurant decision', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { name: /stop scrolling/i })).toBeVisible();
	const spinButton = page.locator('.spin-button');
	await spinButton.click();

	await expect(page.getByText('Fortune favors')).toBeVisible({ timeout: 3_000 });
	await expect(page.getByText(/maps become available with live listings/i)).toBeVisible();
	await expect(page.getByRole('link', { name: /open in maps/i })).toHaveCount(0);
	await expect(spinButton).toBeFocused();
});

test('suggests a cuisine represented in the demo data', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByLabel(/add a craving/i)).toHaveAttribute('placeholder', /Try .*mexican/i);
});

test('publishes live-provider privacy and terms disclosures', async ({ page }) => {
	await page.goto('/');
	await page.getByRole('link', { name: 'Privacy' }).click();
	await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
	const locationSection = page
		.locator('section')
		.filter({ has: page.getByRole('heading', { name: 'Location and restaurant searches' }) });
	await expect(locationSection.getByText(/Google Maps Platform APIs/i)).toBeVisible();
	await expect(locationSection.getByText(/not stored by Meal of Fortune/i)).toBeVisible();

	await page.getByRole('link', { name: 'Terms' }).click();
	await expect(page.getByRole('heading', { name: 'Terms of Use' })).toBeVisible();
	await expect(page.getByText(/Google Maps Platform Terms of Service/i)).toBeVisible();
});

test('loads a live restaurant and shows its aggregate Google rating without review content', async ({
	page
}) => {
	let requestBody: unknown;
	await page.route('**/api/restaurants', async (route) => {
		requestBody = route.request().postDataJSON();
		await new Promise((resolve) => setTimeout(resolve, 150));
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				configured: true,
				restaurants: [
					{
						id: 'google-real-1',
						name: 'Real Verde Kitchen',
						address: '100 Real Street',
						cuisines: ['mexican'],
						traits: [],
						distanceMiles: 1.25,
						priceLevel: 2,
						isOpen: true,
						rating: 4.7,
						ratingCount: 321,
						mapsUri: 'https://maps.google.com/?cid=123',
						source: 'google'
					}
				]
			})
		});
	});
	await page.goto('/');
	await page.getByLabel(/U\.S\. city and state, or ZIP/i).fill('Midtown Atlanta');
	await page.getByRole('button', { name: 'Set', exact: true }).click();
	await page.getByRole('button', { name: /spin the wheel/i }).click();
	await expect(page.getByRole('status')).toContainText(/finding real restaurants/i);
	await expect(page.getByRole('status')).toContainText(/found 1 live restaurant/i);

	await expect(page.getByRole('heading', { name: 'Real Verde Kitchen' })).toBeVisible({
		timeout: 5_000
	});
	expect(requestBody).toEqual({ location: { area: 'Midtown Atlanta' }, radiusMiles: 5 });
	await expect(page.getByText(/4\.7 on Google Maps/i)).toBeVisible();
	await expect(page.getByText(/321 ratings/i)).toBeVisible();
	await expect(page.getByRole('link', { name: /open in Google Maps/i })).toHaveAttribute(
		'href',
		'https://maps.google.com/?cid=123'
	);
	await expect(page.getByAltText('Google Maps', { exact: true })).toBeVisible();
	await expect(page.getByText(/review text that should not exist/i)).toHaveCount(0);
});

test('keeps Google attribution when a live result has no Maps link', async ({ page }) => {
	await page.route('**/api/restaurants', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				configured: true,
				restaurants: [
					{
						id: 'google-no-link',
						name: 'Attributed Kitchen',
						address: '101 Real Street',
						cuisines: ['mexican'],
						traits: [],
						distanceMiles: 1,
						priceLevel: 2,
						isOpen: true,
						rating: 4.5,
						ratingCount: 20,
						source: 'google'
					}
				]
			})
		});
	});
	await page.goto('/');
	await page.getByLabel(/U\.S\. city and state, or ZIP/i).fill('30318');
	await page.getByRole('button', { name: 'Set', exact: true }).click();
	await page.getByRole('button', { name: /spin the wheel/i }).click();

	await expect(page.getByRole('heading', { name: 'Attributed Kitchen' })).toBeVisible({
		timeout: 5_000
	});
	await expect(page.getByAltText('Google Maps', { exact: true })).toBeVisible();
	await expect(page.getByRole('link', { name: /open in Google Maps/i })).toHaveCount(0);
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
	await page.getByLabel(/U\.S\. city and state, or ZIP/i).fill('Midtown');
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
