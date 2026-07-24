<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Privacy · Meal of Fortune</title>
	<meta
		name="description"
		content="How Meal of Fortune handles location and restaurant information."
	/>
</svelte:head>

<main class="policy-page">
	<a class="back" href={resolve('/')}>← Meal of Fortune</a>
	<p class="eyebrow">Your data</p>
	<h1>Privacy</h1>
	<p class="summary">
		Meal of Fortune is designed to make one restaurant decision without building a profile about
		you.
	</p>

	<section>
		<h2>Location and restaurant searches</h2>
		<p>
			When you choose current location or enter an area, that location is sent to Meal of Fortune's
			server and then to Google Maps Platform APIs solely to find nearby restaurants.
		</p>
		<p>
			Your precise location and the returned restaurant results are not stored by Meal of Fortune.
			They remain in short-lived page memory for the active decision session and disappear when the
			page is closed or refreshed.
		</p>
	</section>

	<section>
		<h2>What the installed app caches</h2>
		<p>
			The service worker caches the static application shell so the interface can reopen offline. It
			does not cache API requests, location values, or live restaurant responses.
		</p>
	</section>

	<section>
		<h2>Providers and hosting</h2>
		<p>
			Google processes Places and Geocoding requests under the
			<a href="https://policies.google.com/privacy" rel="noreferrer">Google Privacy Policy</a>. The
			hosting platform may process ordinary connection metadata such as IP address and request
			timing for security and operations. Meal of Fortune does not intentionally log request bodies,
			coordinates, or provider responses.
		</p>
	</section>

	<section>
		<h2>Accounts, ads, and analytics</h2>
		<p>
			This version has no user accounts, ad tracking, paid placement, or third-party behavioral
			analytics.
		</p>
	</section>

	<nav aria-label="Policy links">
		<a href={resolve('/terms')}>Terms</a>
		<a href="https://github.com/Knosence9/meal-of-fortune/issues">Questions or corrections</a>
	</nav>
</main>

<style>
	.policy-page {
		max-width: 760px;
		margin: 0 auto;
		padding: 56px 28px 80px;
	}
	.back,
	nav a {
		color: var(--plum);
		font-weight: 750;
	}
	.eyebrow {
		margin: 52px 0 8px;
		color: var(--orange-dark);
		font-size: 0.76rem;
		font-weight: 800;
		letter-spacing: 0.13em;
		text-transform: uppercase;
	}
	h1,
	h2 {
		font-family: 'Fraunces', Georgia, serif;
	}
	h1 {
		margin: 0;
		font-size: clamp(3rem, 9vw, 5rem);
	}
	.summary {
		font-size: 1.2rem;
		color: var(--muted);
	}
	section {
		margin-top: 36px;
	}
	h2 {
		margin-bottom: 8px;
	}
	p {
		line-height: 1.7;
	}
	section p {
		color: var(--muted);
	}
	nav {
		display: flex;
		flex-wrap: wrap;
		gap: 18px;
		margin-top: 48px;
		padding-top: 24px;
		border-top: 1px solid var(--line);
	}
</style>
