<script lang="ts">
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>Terms of Use · Meal of Fortune</title>
	<meta name="description" content="Terms for using Meal of Fortune." />
</svelte:head>

<main class="policy-page">
	<a class="back" href={resolve('/')}>← Meal of Fortune</a>
	<p class="eyebrow">The ground rules</p>
	<h1>Terms of Use</h1>
	<p class="summary">
		Meal of Fortune is a decision aid. It does not guarantee that provider information is complete,
		current, or error-free.
	</p>

	<section>
		<h2>Restaurant information</h2>
		<p>
			Names, addresses, hours, prices, ratings, rating counts, and links may come from Google Maps
			Platform. Verify important details directly with the restaurant before traveling or ordering.
			Google content is governed by the
			<a href="https://cloud.google.com/maps-platform/terms" rel="noreferrer"
				>Google Maps Platform Terms of Service</a
			>.
		</p>
	</section>

	<section>
		<h2>How the wheel decides</h2>
		<p>
			Practical constraints determine eligibility. Craving matches influence the disclosed random
			weight. Provider ratings are shown for context but do not change the selection odds. Meal of
			Fortune does not sell placement in the wheel.
		</p>
	</section>

	<section>
		<h2>No endorsement or warranty</h2>
		<p>
			A result is not an endorsement, safety certification, dietary guarantee, or statement that a
			restaurant will meet an allergy or accessibility need. Use the service at your own discretion.
		</p>
	</section>

	<section>
		<h2>Changes and availability</h2>
		<p>
			The service and its data providers may change, become unavailable, or impose usage limits.
			These terms may be updated when the product or provider requirements change.
		</p>
	</section>

	<nav aria-label="Policy links">
		<a href={resolve('/privacy')}>Privacy</a>
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
