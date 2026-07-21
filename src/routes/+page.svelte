<script lang="ts">
	import { resolve } from '$app/paths';
	import { decideRestaurant, type RestaurantDecision } from '$lib/domain/decision';
	import { demoRestaurants } from '$lib/data/demo-restaurants';

	const suggestions = [
		'spicy',
		'comfort',
		'fresh',
		'savory',
		'sweet',
		'indian',
		'mexican',
		'italian',
		'japanese',
		'mediterranean'
	];
	const wheelWords = ['SPICY', 'FRESH', 'COZY', 'SWEET', 'BOLD', 'LIGHT'];

	let cravings = $state<string[]>(['savory']);
	let cravingInput = $state('');
	let radiusMiles = $state(5);
	let openNow = $state(true);
	let priceLevels = $state<number[]>([]);
	let seenIds = $state<string[]>([]);
	let result = $state<RestaurantDecision | null>(null);
	let spinning = $state(false);
	let spinEpoch = 0;
	let notice = $state('');
	let locationLabel = $state('Demo neighborhood');
	let manualLocation = $state('');
	let locationStatus = $state<'idle' | 'requesting' | 'ready' | 'denied'>('idle');
	let locationEpoch = 0;

	let selectedDemo = $derived(
		result
			? demoRestaurants.find((restaurant) => restaurant.id === result?.restaurant.id)
			: undefined
	);
	let matchingCount = $derived(
		demoRestaurants.filter(
			(restaurant) =>
				restaurant.distanceMiles <= radiusMiles &&
				(!openNow || restaurant.isOpen) &&
				(priceLevels.length === 0 || priceLevels.includes(restaurant.priceLevel))
		).length
	);

	function addCraving(value: string): void {
		const normalized = value.trim().toLowerCase();
		if (!normalized || cravings.includes(normalized)) return;
		cravings = [...cravings, normalized];
		cravingInput = '';
		clearDecisionState();
	}

	function removeCraving(value: string): void {
		cravings = cravings.filter((craving) => craving !== value);
		clearDecisionState();
	}

	function togglePrice(level: number): void {
		priceLevels = priceLevels.includes(level)
			? priceLevels.filter((price) => price !== level)
			: [...priceLevels, level];
		clearDecisionState();
	}

	function clearDecisionState(): void {
		spinEpoch += 1;
		spinning = false;
		seenIds = [];
		result = null;
		notice = '';
	}

	function spin(): void {
		if (spinning || cravings.length === 0) return;

		let decision = decideRestaurant({
			candidates: demoRestaurants,
			cravings,
			constraints: { radiusMiles, openNow, priceLevels },
			seenIds,
			random: Math.random
		});

		if (!decision && seenIds.length > 0) {
			seenIds = [];
			decision = decideRestaurant({
				candidates: demoRestaurants,
				cravings,
				constraints: { radiusMiles, openNow, priceLevels },
				seenIds: [],
				random: Math.random
			});
		}

		if (!decision) {
			result = null;
			notice = 'No demo restaurants fit those filters. Try a wider radius or another price.';
			return;
		}

		const epoch = ++spinEpoch;
		spinning = true;
		result = null;
		notice = '';
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.setTimeout(
			() => {
				if (epoch !== spinEpoch) return;
				result = decision;
				seenIds = [...seenIds, decision.restaurant.id];
				spinning = false;
			},
			reducedMotion ? 20 : 1050
		);
	}

	function useCurrentLocation(): void {
		if (!navigator.geolocation) {
			locationStatus = 'denied';
			notice = 'This browser does not provide location. Enter an area instead.';
			return;
		}

		const epoch = ++locationEpoch;
		locationStatus = 'requesting';
		navigator.geolocation.getCurrentPosition(
			() => {
				if (epoch !== locationEpoch) return;
				clearDecisionState();
				locationLabel = 'Current location';
				locationStatus = 'ready';
				notice = 'Location accepted. The prototype still uses its curated demo restaurant set.';
			},
			() => {
				if (epoch !== locationEpoch) return;
				locationStatus = 'denied';
				notice = 'Location was not shared. You can type a neighborhood, city, or ZIP instead.';
			},
			{ enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
		);
	}

	function setManualLocation(): void {
		const value = manualLocation.trim();
		if (!value) return;
		locationEpoch += 1;
		clearDecisionState();
		locationLabel = value;
		locationStatus = 'ready';
		manualLocation = '';
		notice =
			'Area saved. Live local search will replace demo restaurants after provider selection.';
	}

	function resetSession(): void {
		seenIds = [];
		result = null;
		notice = '';
	}
</script>

<svelte:head>
	<meta property="og:title" content="Meal of Fortune" />
	<meta property="og:description" content="Stop scrolling. Start spinning." />
</svelte:head>

<header class="site-header">
	<a class="brand" href={resolve('/')} aria-label="Meal of Fortune home">
		<span class="brand-mark" aria-hidden="true">✦</span>
		<span>Meal of Fortune</span>
	</a>
	<span class="prototype-badge">MVP preview</span>
</header>

<main>
	<section class="hero">
		<div class="eyebrow"><span></span> Dinner indecision ends here</div>
		<h1>Stop scrolling.<br /><em>Start spinning.</em></h1>
		<p class="hero-copy">
			Tell us what sounds good. We filter the options, add a little chance, and make one confident
			restaurant decision.
		</p>
		<div class="trust-row" aria-label="Product principles">
			<span>✓ Filter first</span><span>✓ Honest odds</span><span>✓ No endless list</span>
		</div>
	</section>

	<section class="decision-grid" aria-label="Restaurant decision maker">
		<div class="controls-card">
			<div class="step-heading">
				<span class="step-number">1</span>
				<div>
					<p class="overline">Set the mood</p>
					<h2>What sounds good?</h2>
				</div>
			</div>

			<div class="chip-list" aria-label="Selected cravings">
				{#each cravings as craving (craving)}
					<button
						class="selected-chip"
						onclick={() => removeCraving(craving)}
						aria-label={`Remove ${craving}`}
						disabled={spinning}
					>
						{craving}<span aria-hidden="true">×</span>
					</button>
				{/each}
			</div>

			<form
				class="craving-form"
				onsubmit={(event) => {
					event.preventDefault();
					addCraving(cravingInput);
				}}
			>
				<label class="sr-only" for="craving">Add a craving</label>
				<input
					id="craving"
					bind:value={cravingInput}
					placeholder="Try ‘salty’, ‘cozy’, or ‘mexican’"
					disabled={spinning}
				/>
				<button type="submit" disabled={spinning || !cravingInput.trim()}>Add</button>
			</form>

			<div class="suggestion-row" aria-label="Craving suggestions">
				{#each suggestions
					.filter((suggestion) => !cravings.includes(suggestion))
					.slice(0, 7) as suggestion (suggestion)}
					<button onclick={() => addCraving(suggestion)} disabled={spinning}>+ {suggestion}</button>
				{/each}
			</div>

			<div class="divider"></div>

			<div class="step-heading compact">
				<span class="step-number">2</span>
				<div>
					<p class="overline">Set the boundaries</p>
					<h2>Keep it practical</h2>
				</div>
			</div>

			<div class="location-box">
				<div>
					<span class="control-label">Search area</span>
					<strong>{locationLabel}</strong>
				</div>
				<button
					class="location-button"
					onclick={useCurrentLocation}
					disabled={spinning || locationStatus === 'requesting'}
				>
					{locationStatus === 'requesting' ? 'Locating…' : 'Use my location'}
				</button>
			</div>
			<form
				class="manual-location"
				onsubmit={(event) => {
					event.preventDefault();
					setManualLocation();
				}}
			>
				<label class="sr-only" for="area">Neighborhood, city, or ZIP</label>
				<input
					id="area"
					bind:value={manualLocation}
					placeholder="Or type an area"
					disabled={spinning}
				/>
				<button type="submit" disabled={spinning || !manualLocation.trim()}>Set</button>
			</form>

			<div class="range-row">
				<label for="radius"><span>Maximum distance</span><strong>{radiusMiles} mi</strong></label>
				<input
					id="radius"
					type="range"
					min="1"
					max="10"
					step="1"
					bind:value={radiusMiles}
					oninput={clearDecisionState}
					disabled={spinning}
				/>
			</div>

			<div class="constraint-row">
				<label class="switch-row">
					<span><strong>Open now</strong><small>Hide places that are closed</small></span>
					<input
						type="checkbox"
						bind:checked={openNow}
						onchange={clearDecisionState}
						disabled={spinning}
					/>
					<span class="switch" aria-hidden="true"></span>
				</label>
				<div class="price-control">
					<span><strong>Price</strong><small>Leave blank for any</small></span>
					<div>
						{#each [1, 2, 3] as level (level)}
							<button
								class:active={priceLevels.includes(level)}
								onclick={() => togglePrice(level)}
								aria-pressed={priceLevels.includes(level)}
								disabled={spinning}
							>
								{'$'.repeat(level)}
							</button>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<div class="wheel-card">
			<div class="wheel-copy">
				<p class="overline">
					{matchingCount} qualified demo {matchingCount === 1 ? 'place' : 'places'}
				</p>
				<h2>Leave the last choice<br />to fortune.</h2>
			</div>

			<div class="wheel-wrap">
				<div class="pointer" aria-hidden="true"></div>
				<div class:spinning class="wheel" aria-hidden="true">
					{#each wheelWords as word, index (word)}
						<span style={`--index: ${index}`}>{word}</span>
					{/each}
					<div class="wheel-center"><span>🍴</span></div>
				</div>
			</div>

			<button
				class="spin-button"
				onclick={spin}
				disabled={cravings.length === 0 || matchingCount === 0}
				aria-disabled={spinning}
			>
				<span>{spinning ? 'Fortune is turning…' : result ? 'Spin again' : 'Spin the wheel'}</span>
				<span aria-hidden="true">→</span>
			</button>
			<p class="fine-print">
				Matching places get better odds. Paid placement never changes the wheel.
			</p>
		</div>
	</section>

	<section class="outcome" aria-live="polite" aria-atomic="true">
		{#if notice}
			<p class="notice">{notice}</p>
		{/if}
		{#if selectedDemo && result}
			<article class="result-card">
				<div class="result-emoji" aria-hidden="true">{selectedDemo.emoji}</div>
				<div class="result-main">
					<p class="overline">Fortune favors</p>
					<h2>{selectedDemo.name}</h2>
					<p>
						{selectedDemo.address} · {selectedDemo.distanceMiles.toFixed(1)} mi · {'$'.repeat(
							selectedDemo.priceLevel
						)}
					</p>
					<div class="reason-list">
						{#if result.reasons.length}
							{#each result.reasons as reason (reason)}<span>{reason}</span>{/each}
						{:else}
							<span>A little pure fortune</span>
						{/if}
					</div>
				</div>
				<div class="result-actions">
					<span class="maps-unavailable">Maps become available with live listings</span>
					<button onclick={resetSession}>Start over</button>
				</div>
			</article>
		{/if}
	</section>

	<section class="prototype-note">
		<span aria-hidden="true">◎</span>
		<div>
			<strong>This MVP uses a curated demo neighborhood.</strong>
			<p>
				Location controls are functional and private, but nearby results remain demo data until the
				provider evaluation is complete. Nothing here is presented as a live local listing.
			</p>
		</div>
	</section>
</main>

<footer>
	<span>Meal of Fortune</span>
	<p>One shared craving list. One honest spin. One decision.</p>
	<a href="https://github.com/Knosence9/meal-of-fortune">View the open-source project ↗</a>
</footer>

<style>
	.site-header {
		max-width: 1180px;
		margin: 0 auto;
		padding: 24px 28px;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		color: var(--ink);
		text-decoration: none;
		font-family: 'Fraunces', serif;
		font-weight: 800;
		font-size: 1.15rem;
	}

	.brand-mark {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: var(--orange);
		color: white;
	}

	.prototype-badge {
		padding: 7px 12px;
		border: 1px solid var(--line);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.62);
		color: var(--muted);
		font-size: 0.76rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	main {
		max-width: 1180px;
		margin: 0 auto;
		padding: 42px 28px 80px;
	}

	.hero {
		max-width: 810px;
		margin-bottom: 52px;
	}

	.eyebrow,
	.overline {
		color: var(--orange-dark);
		font-size: 0.74rem;
		font-weight: 800;
		letter-spacing: 0.13em;
		text-transform: uppercase;
	}

	.eyebrow {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.eyebrow span {
		width: 28px;
		height: 2px;
		background: var(--orange);
	}

	h1 {
		margin: 16px 0 18px;
		font-family: 'Fraunces', Georgia, serif;
		font-size: clamp(3.15rem, 8vw, 6.6rem);
		line-height: 0.91;
		letter-spacing: -0.065em;
	}

	h1 em {
		color: var(--orange);
		font-style: italic;
		font-weight: 700;
	}

	.hero-copy {
		max-width: 650px;
		font-size: clamp(1.05rem, 2vw, 1.28rem);
		line-height: 1.6;
		color: var(--muted);
	}

	.trust-row {
		display: flex;
		flex-wrap: wrap;
		gap: 12px 24px;
		margin-top: 24px;
		font-size: 0.86rem;
		font-weight: 700;
		color: var(--plum);
	}

	.decision-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.08fr) minmax(340px, 0.92fr);
		gap: 28px;
		align-items: stretch;
	}

	.controls-card,
	.wheel-card {
		border: 1px solid rgba(90, 57, 33, 0.1);
		border-radius: 32px;
		box-shadow: var(--shadow);
	}

	.controls-card {
		padding: clamp(24px, 4vw, 42px);
		background: rgba(255, 253, 249, 0.94);
	}

	.wheel-card {
		padding: clamp(24px, 4vw, 40px);
		background: var(--plum);
		color: white;
		overflow: hidden;
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		min-height: 680px;
	}

	.wheel-card::before {
		content: '';
		position: absolute;
		width: 300px;
		height: 300px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.045);
		right: -140px;
		top: -120px;
	}

	.step-heading {
		display: flex;
		gap: 15px;
		align-items: center;
		margin-bottom: 22px;
	}

	.step-heading.compact {
		margin-bottom: 18px;
	}

	.step-heading p,
	.step-heading h2,
	.wheel-copy p,
	.wheel-copy h2,
	.result-main p,
	.result-main h2,
	.prototype-note p,
	footer p {
		margin: 0;
	}

	.step-heading h2,
	.wheel-copy h2 {
		font-family: 'Fraunces', Georgia, serif;
		font-size: clamp(1.55rem, 3vw, 2.15rem);
		line-height: 1.06;
		letter-spacing: -0.03em;
	}

	.step-number {
		display: grid;
		place-items: center;
		width: 42px;
		height: 42px;
		border-radius: 50%;
		background: var(--plum);
		color: white;
		font-weight: 800;
		flex: 0 0 auto;
	}

	.chip-list,
	.suggestion-row,
	.reason-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.selected-chip,
	.suggestion-row button,
	.reason-list span {
		border-radius: 999px;
		font-size: 0.84rem;
		font-weight: 700;
	}

	.selected-chip {
		min-height: 40px;
		border: 0;
		padding: 9px 12px;
		background: #efe3f0;
		color: var(--plum);
	}

	.selected-chip span {
		margin-left: 6px;
		font-size: 1rem;
	}

	.craving-form,
	.manual-location {
		display: flex;
		gap: 8px;
		margin-top: 12px;
	}

	.craving-form input,
	.manual-location input {
		min-width: 0;
		flex: 1;
		border: 1px solid var(--line);
		border-radius: 14px;
		background: white;
		padding: 13px 14px;
		color: var(--ink);
	}

	.craving-form button,
	.manual-location button,
	.location-button {
		border: 0;
		border-radius: 13px;
		padding: 0 16px;
		background: var(--ink);
		color: white;
		font-weight: 700;
	}

	.suggestion-row {
		margin-top: 13px;
	}

	.suggestion-row button {
		min-height: 40px;
		border: 1px solid var(--line);
		padding: 7px 10px;
		background: transparent;
		color: var(--muted);
	}

	.divider {
		height: 1px;
		background: var(--line);
		margin: 32px 0;
	}

	.location-box {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 14px 16px;
		background: #f6f1ea;
		border-radius: 16px;
	}

	.location-box div,
	.range-row label,
	.switch-row span:first-child,
	.price-control > span {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.control-label,
	.switch-row small,
	.price-control small {
		font-size: 0.73rem;
		color: var(--muted);
	}

	.location-button {
		padding: 10px 13px;
		background: white;
		color: var(--plum);
		border: 1px solid var(--line);
		white-space: nowrap;
	}

	.manual-location {
		margin-top: 8px;
	}

	.range-row {
		margin: 24px 0 16px;
	}

	.range-row label {
		flex-direction: row;
		justify-content: space-between;
		font-size: 0.85rem;
	}

	.range-row input {
		width: 100%;
		accent-color: var(--orange);
	}

	.constraint-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.switch-row,
	.price-control {
		min-height: 70px;
		padding: 13px;
		border: 1px solid var(--line);
		border-radius: 15px;
		background: white;
	}

	.switch-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: relative;
	}

	.switch-row input {
		position: absolute;
		opacity: 0;
	}

	.switch {
		width: 40px;
		height: 24px;
		border-radius: 999px;
		background: #cfc6bd;
		position: relative;
		transition: 180ms ease;
	}

	.switch::after {
		content: '';
		position: absolute;
		width: 18px;
		height: 18px;
		left: 3px;
		top: 3px;
		border-radius: 50%;
		background: white;
		transition: 180ms ease;
	}

	.switch-row input:focus-visible + .switch {
		outline: 3px solid rgba(91, 43, 99, 0.58);
		outline-offset: 3px;
	}

	.switch-row input:checked + .switch {
		background: var(--orange);
	}

	.switch-row input:checked + .switch::after {
		transform: translateX(16px);
	}

	.price-control {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.price-control div {
		display: flex;
		gap: 4px;
	}

	.price-control button {
		width: 40px;
		height: 40px;
		border: 1px solid var(--line);
		border-radius: 9px;
		background: white;
		color: var(--muted);
		font-size: 0.7rem;
	}

	.price-control button.active {
		background: var(--plum);
		color: white;
		border-color: var(--plum);
	}

	.wheel-copy {
		position: relative;
		z-index: 1;
	}

	.wheel-card .overline {
		color: #f6cf7a;
	}

	.wheel-copy h2 {
		font-size: clamp(2rem, 4vw, 3.2rem);
		margin-top: 7px;
	}

	.wheel-wrap {
		position: relative;
		width: min(360px, 82vw);
		aspect-ratio: 1;
		margin: 24px auto;
	}

	.wheel {
		position: absolute;
		inset: 0;
		border-radius: 50%;
		border: 10px solid rgba(255, 255, 255, 0.9);
		background: conic-gradient(
			#f26b38 0deg 60deg,
			#f5bc42 60deg 120deg,
			#b8dbc5 120deg 180deg,
			#ef8d64 180deg 240deg,
			#f4d078 240deg 300deg,
			#8c5a91 300deg 360deg
		);
		box-shadow:
			0 18px 45px rgba(24, 9, 28, 0.35),
			inset 0 0 0 5px rgba(36, 28, 24, 0.18);
		transition: transform 1s cubic-bezier(0.16, 0.78, 0.18, 1);
	}

	.wheel.spinning {
		transform: rotate(1065deg);
	}

	.wheel > span {
		--angle: calc(var(--index) * 60deg + 30deg);
		position: absolute;
		left: 50%;
		top: 50%;
		width: 42%;
		transform-origin: 0 0;
		transform: rotate(var(--angle)) translate(24%, -50%);
		font-size: clamp(0.62rem, 2.3vw, 0.78rem);
		font-weight: 800;
		letter-spacing: 0.1em;
		color: #2d2025;
		text-align: center;
	}

	.wheel-center {
		position: absolute;
		width: 25%;
		aspect-ratio: 1;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		background: var(--paper);
		border: 7px solid var(--ink);
		display: grid;
		place-items: center;
		font-size: clamp(1.25rem, 4vw, 2.2rem);
	}

	.pointer {
		position: absolute;
		z-index: 3;
		left: 50%;
		top: -7px;
		transform: translateX(-50%);
		width: 0;
		height: 0;
		border-left: 18px solid transparent;
		border-right: 18px solid transparent;
		border-top: 36px solid white;
		filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.2));
	}

	.spin-button {
		position: relative;
		z-index: 1;
		width: 100%;
		min-height: 58px;
		border: 0;
		border-radius: 16px;
		padding: 0 20px;
		background: var(--orange-dark);
		color: white;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: space-between;
		box-shadow: 0 10px 24px rgba(39, 10, 5, 0.28);
	}

	.spin-button:focus-visible {
		box-shadow:
			0 0 0 6px #241c18,
			0 10px 24px rgba(39, 10, 5, 0.28);
	}

	.spin-button:hover:not(:disabled):not([aria-disabled='true']) {
		background: #b83b12;
		transform: translateY(-1px);
	}

	.spin-button[aria-disabled='true'] {
		cursor: wait;
		opacity: 0.78;
	}

	.fine-print {
		margin: 12px 0 0;
		font-size: 0.72rem;
		line-height: 1.5;
		text-align: center;
		color: rgba(255, 255, 255, 0.66);
	}

	.outcome {
		margin-top: 28px;
	}

	.notice {
		padding: 14px 18px;
		border-radius: 14px;
		background: #fff0d3;
		color: #65440a;
		font-weight: 600;
	}

	.result-card {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 22px;
		align-items: center;
		padding: 24px;
		border-radius: 24px;
		background: var(--paper);
		border: 1px solid var(--line);
		box-shadow: var(--shadow);
		animation: reveal 400ms ease-out both;
	}

	@keyframes reveal {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.result-emoji {
		display: grid;
		place-items: center;
		width: 78px;
		height: 78px;
		border-radius: 22px;
		background: #f6ede4;
		font-size: 2.5rem;
	}

	.result-main h2 {
		font-family: 'Fraunces', Georgia, serif;
		font-size: 2rem;
		line-height: 1;
		margin: 5px 0 7px;
	}

	.result-main > p:not(.overline) {
		color: var(--muted);
	}

	.reason-list {
		margin-top: 10px;
	}

	.reason-list span {
		padding: 6px 9px;
		background: #efe3f0;
		color: var(--plum);
		font-size: 0.74rem;
	}

	.result-actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.maps-unavailable {
		max-width: 180px;
		color: var(--muted);
		font-size: 0.75rem;
		line-height: 1.35;
		text-align: center;
	}

	.result-actions button {
		border-radius: 12px;
		padding: 11px 9px;
		font-size: 0.9rem;
		font-weight: 700;
		text-decoration: none;
		text-align: center;
		white-space: nowrap;
	}

	.result-actions button {
		border: 1px solid var(--line);
		background: white;
		color: var(--ink);
	}

	.prototype-note {
		margin-top: 28px;
		padding: 20px 22px;
		display: flex;
		gap: 15px;
		border: 1px dashed #c7aa8e;
		border-radius: 18px;
		background: rgba(255, 253, 249, 0.54);
	}

	.prototype-note > span {
		font-size: 1.5rem;
		color: var(--orange-dark);
	}

	.prototype-note p {
		margin-top: 5px;
		color: var(--muted);
		line-height: 1.5;
		font-size: 0.86rem;
	}

	footer {
		max-width: 1180px;
		margin: 0 auto;
		padding: 28px;
		border-top: 1px solid var(--line);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		color: var(--muted);
		font-size: 0.8rem;
	}

	footer > span {
		font-family: 'Fraunces', Georgia, serif;
		font-weight: 800;
		color: var(--ink);
	}

	footer a {
		color: var(--plum);
		font-weight: 700;
	}

	@media (max-width: 860px) {
		main {
			padding-top: 24px;
		}
		.decision-grid {
			grid-template-columns: 1fr;
		}
		.wheel-card {
			min-height: auto;
		}
		.wheel-wrap {
			width: min(340px, 78vw);
		}
	}

	@media (max-width: 620px) {
		.site-header,
		main,
		footer {
			padding-left: 18px;
			padding-right: 18px;
		}
		.site-header {
			padding-top: 17px;
			padding-bottom: 17px;
		}
		.prototype-badge {
			font-size: 0.64rem;
		}
		.hero {
			margin-bottom: 34px;
		}
		h1 {
			font-size: clamp(3.3rem, 16vw, 4.8rem);
		}
		.controls-card,
		.wheel-card {
			border-radius: 24px;
		}
		.constraint-row {
			grid-template-columns: 1fr;
		}
		.location-box {
			align-items: stretch;
			flex-direction: column;
		}
		.location-button {
			min-height: 42px;
		}
		.result-card {
			grid-template-columns: auto 1fr;
		}
		.result-actions {
			grid-column: 1 / -1;
			display: grid;
			grid-template-columns: 1fr 1fr;
		}
		footer {
			flex-direction: column;
			align-items: flex-start;
		}
	}

	@media (max-width: 390px) {
		.craving-form,
		.manual-location {
			flex-direction: column;
		}
		.craving-form button,
		.manual-location button {
			min-height: 42px;
		}
		.result-card {
			grid-template-columns: 1fr;
		}
		.result-emoji {
			width: 64px;
			height: 64px;
		}
	}
</style>
