<script lang="ts">
	import BigLoader from '$lib/components/BigLoader.svelte';
	import Calendar from '$lib/components/Calendar.svelte';
	import DateStepper from '$lib/components/DateStepper.svelte';
	import FreshnessIndicator from '$lib/components/FreshnessIndicator.svelte';
	import { buildLoadingMessageList } from '$lib/loadingMessages';
	import type { Booking } from '$lib/types';
	import { getBollTitle } from '$lib/utils';
	import { getMiddayWeather } from '$lib/weather/getMiddayWeather';
	import { Temporal } from '@js-temporal/polyfill';
	import { tick } from 'svelte';
	import { browser } from '$app/environment';

	const { data } = $props();

	const targetDate = $derived(Temporal.PlainDate.from(data.date));
	const bollTitle = $derived(getBollTitle(targetDate));
	const middayWeather = $derived(getMiddayWeather(data.weather, targetDate));
	const loadingMessageList = $derived(buildLoadingMessageList(middayWeather));

	let freshResult: { bookings: Booking[]; scrapedAt: string } | null = $state(null);
	let scrapeError: unknown = $state(null);
	let settled = $state(false);

	const bookingList = $derived.by(() => freshResult?.bookings ?? data.bookings);
	const scrapedAt = $derived.by(() => freshResult?.scrapedAt ?? data.scrapedAt);
	const refreshing = $derived.by(() => !!data.fresh && !freshResult && !scrapeError && !settled);

	async function applyFreshResult(
		result: { bookings: Booking[]; scrapedAt: string },
		signal: { cancelled: boolean }
	) {
		if (signal.cancelled) return;

		const doUpdate = async () => {
			if (signal.cancelled) return;
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
		settled = false;

		if (!pending) return;

		const signal = { cancelled: false };
		const FRESH_TIMEOUT_MS = 45_000;
		const timeoutId = setTimeout(() => {
			if (signal.cancelled) return;
			scrapeError = new Error('Hämtningen tog för lång tid. Pröva att ladda om sidan.');
		}, FRESH_TIMEOUT_MS);

		pending
			.then((result) => {
				clearTimeout(timeoutId);
				if (signal.cancelled) return;
				if ('preempted' in result) {
					// Preempt means a newer scrape took the queue slot. Our cached
					// bookings stay accurate — clear the refreshing state so the
					// spinner doesn't spin forever.
					settled = true;
					return;
				}
				applyFreshResult(result, signal);
			})
			.catch((error: unknown) => {
				clearTimeout(timeoutId);
				if (!signal.cancelled) scrapeError = error;
			});

		return () => {
			signal.cancelled = true;
			clearTimeout(timeoutId);
		};
	});
</script>

<svelte:head>
	<title>E Planen Ledig På Söndag - Söndagsboll ⚽️</title>
</svelte:head>

<main>
	<h1 class="title">{bollTitle}</h1>
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
