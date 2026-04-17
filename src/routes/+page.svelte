<script lang="ts">
	import BigLoader from '$lib/components/BigLoader.svelte';
	import Calendar from '$lib/components/Calendar.svelte';
	import DateStepper from '$lib/components/DateStepper.svelte';
	import FreshnessIndicator from '$lib/components/FreshnessIndicator.svelte';
	import { buildLoadingMessageList } from '$lib/loadingMessages';
	import type { Booking } from '$lib/types';
	import { getMiddayWeather } from '$lib/weather/getMiddayWeather';
	import { tick } from 'svelte';
	import { browser } from '$app/environment';

	const { data } = $props();

	const middayWeather = $derived(getMiddayWeather(data.weather, new Date(data.date)));
	const targetDate = $derived(new Date(data.date));
	const loadingMessageList = $derived(buildLoadingMessageList(middayWeather));

	let freshResult: { bookings: Booking[]; scrapedAt: string } | null = $state(null);
	let scrapeError: unknown = $state(null);

	const bookingList = $derived.by(() => freshResult?.bookings ?? data.bookings);
	const scrapedAt = $derived.by(() => freshResult?.scrapedAt ?? data.scrapedAt);
	const refreshing = $derived.by(() => !!data.fresh && !freshResult && !scrapeError);

	async function applyFreshResult(result: { bookings: Booking[]; scrapedAt: string }) {
		const doUpdate = async () => {
			freshResult = result;
			await tick();
		};

		if (browser && document.startViewTransition) {
			document.startViewTransition(() => doUpdate());
		} else {
			await doUpdate();
		}
	}

	$effect(() => {
		const pending = data.fresh;

		freshResult = null;
		scrapeError = null;

		if (!pending) return;

		let cancelled = false;
		pending
			.then((result: { bookings: Booking[]; scrapedAt: string }) => {
				if (!cancelled) applyFreshResult(result);
			})
			.catch((error: unknown) => {
				if (!cancelled) scrapeError = error;
			});

		return () => {
			cancelled = true;
		};
	});
</script>

<svelte:head>
	<title>E Planen Ledig På Söndag - Söndagsboll ⚽️</title>
</svelte:head>

<main>
	<h1 class="title">Söndagsboll ⚽️</h1>
	<p class="meta">
		<DateStepper date={targetDate} />
		{#if middayWeather.middayWeatherEntry}
			&nbsp;|&nbsp;
			<img
				src="weather-icons/{middayWeather.middayWeatherSymbol}.png"
				alt={middayWeather.middayWeatherLabel ?? middayWeather.middayWeatherSymbol}
			/>

			{#if middayWeather.middayWeatherLabel}
				&nbsp;<small>({middayWeather.middayWeatherLabel})</small>
			{/if}

			&nbsp;
			<span>{middayWeather.middayWeatherTemperature?.toFixed(1)}°</span>
		{/if}
	</p>

	{#if bookingList && scrapedAt}
		<FreshnessIndicator {scrapedAt} {refreshing} />
		<Calendar bookings={bookingList} weatherEntries={middayWeather.targetDateWeatherEntryList} />
	{:else if refreshing}
		<BigLoader messages={loadingMessageList} delayMs={4000} />
	{:else}
		<div>
			<h2>Nåt gick riktigt snett 😭.</h2>
			{#if scrapeError}
				<p>Här är felet:</p>
				<code
					><pre>{JSON.stringify(
							scrapeError,
							Object.getOwnPropertyNames(scrapeError),
							2
						)}</pre></code
				>
			{/if}
			<p>
				Skriv till Hektor eller ännu bättre lägg en PR <a
					href="https://github.com/HektorW/eplanenledigposondag"
					target="_blank">https://github.com/HektorW/eplanenledigposondag</a
				>
			</p>
		</div>
	{/if}
</main>

<style>
	main {
		display: grid;
		grid-template-rows: auto auto 1fr;
		margin-inline: auto;
		max-width: 50em;
		min-height: 100svh;
		padding: 1rem;
	}

	.title {
		font-size: 2.5rem;
		font-weight: 900;
		margin: 0;
	}

	.meta {
		align-items: center;
		display: flex;
		font-size: 1rem;
		font-weight: 400;
		margin-block: 0 2rem;

		img {
			height: 1em;
			width: 1em;
		}
	}
</style>
