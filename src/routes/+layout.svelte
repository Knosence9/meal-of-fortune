<script lang="ts">
	import favicon from '$lib/assets/meal-wheel.svg';
	import packageInfo from '../../package.json';
	import '../app.css';

	let { children } = $props();
	const appVersion = packageInfo.version;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="theme-color" content="#fff9f0" />
	<meta name="description" content="Turn shared cravings into one restaurant decision." />
	<title>Meal of Fortune</title>
</svelte:head>

{@render children()}

<div class="app-version">Version {appVersion}</div>

<style>
	.app-version {
		padding: 0.75rem 1rem 1.25rem;
		color: #665f57;
		font-size: 0.75rem;
		text-align: center;
	}
</style>
