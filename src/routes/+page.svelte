<script lang="ts">
	import { hasConflict } from '$lib/calendar';
	import BigLoader from '$lib/components/BigLoader.svelte';
	import Calendar from '$lib/components/Calendar.svelte';
	import FreshnessIndicator from '$lib/components/FreshnessIndicator.svelte';
	import SharePanel from '$lib/components/SharePanel.svelte';
	import { buildLoadingMessageList } from '$lib/loadingMessages';
	import type { Booking, TimeSuggestion } from '$lib/types';
	import { getMiddayWeather } from '$lib/weather/getMiddayWeather';
	import { tick, onMount } from 'svelte';
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

	let suggestion: TimeSuggestion | null = $state(null);

	$effect(() => {
		if (!suggestion || !bookingList) return;
		if (
			hasConflict(
				bookingList,
				suggestion.court,
				suggestion.startMinutes,
				suggestion.durationMinutes
			)
		) {
			suggestion = null;
		}
	});

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

	onMount(() => {
		if (data.fresh) {
			data.fresh
				.then((result: { bookings: Booking[]; scrapedAt: string }) => applyFreshResult(result))
				.catch((error: unknown) => {
					scrapeError = error;
				});
		}
	});
</script>

<svelte:head>
	<title>E Planen Ledig På Söndag - Söndagsboll ⚽️</title>
</svelte:head>

<main>
	<h1 class="title">Söndagsboll ⚽️</h1>
	<p class="meta">
		<time datetime={targetDate.toDateString()}
			>{targetDate.toLocaleDateString('sv-SE', {
				day: 'numeric',
				month: 'long'
			})}</time
		>
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
		<Calendar
			bookings={bookingList}
			weatherEntries={middayWeather.targetDateWeatherEntryList}
			bind:suggestion
		/>

		{#if !suggestion}
			<p class="hint">Tryck på en ledig tid för att skapa ett tidsförslag</p>
		{/if}
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

{#if bookingList}
	<SharePanel bind:suggestion bookings={bookingList} date={targetDate} />
{/if}

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

	.hint {
		font-size: 0.75rem;
		margin-top: 1.5rem;
		opacity: 0.45;
		text-align: center;
	}
</style>
