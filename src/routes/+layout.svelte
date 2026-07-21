<script lang="ts">
	import favicon from '$lib/assets/meal-wheel.svg';
	import '../app.css';

	let { children } = $props();
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
