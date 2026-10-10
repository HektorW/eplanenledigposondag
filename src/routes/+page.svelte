<script lang="ts">
	import { hasConflict } from '$lib/calendar';
	import BigLoader from '$lib/components/BigLoader.svelte';
	import Calendar from '$lib/components/Calendar.svelte';
	import DateStepper from '$lib/components/DateStepper.svelte';
	import FieldChips, { type FieldChip } from '$lib/components/FieldChips.svelte';
	import FreshnessIndicator from '$lib/components/FreshnessIndicator.svelte';
	import SharePanel from '$lib/components/SharePanel.svelte';
	import { buildLoadingMessageList } from '$lib/loadingMessages';
	import { buildPageQuery, FIELD_LIST } from '$lib/fields';
	import type { Booking, TimeSuggestion, WeatherResponseData } from '$lib/types';
	import { getBollTitle } from '$lib/utils';
	import { getMiddayWeather } from '$lib/weather/getMiddayWeather';
	import { Temporal } from '@js-temporal/polyfill';
	import { tick } from 'svelte';
	import { browser } from '$app/environment';

	const { data } = $props();

	const targetDate = $derived(Temporal.PlainDate.from(data.date));
	const bollTitle = $derived(getBollTitle(targetDate));

	// Weather is server-rendered when cached, otherwise streamed. While a
	// stream is pending, keep the last streamed value so the meta line doesn't
	// flicker across navigations.
	let streamedWeather: WeatherResponseData | null = $state(null);
	const weather = $derived(data.weather ?? streamedWeather);
	$effect(() => {
		const pending = data.weatherPending;
		if (!pending) return;
		let cancelled = false;
		pending
			.then((result) => {
				if (!cancelled) streamedWeather = result;
			})
			.catch(() => {
				// Stream cut off mid-navigation — keep whatever we had.
			});
		return () => {
			cancelled = true;
		};
	});

	const middayWeather = $derived(getMiddayWeather(weather, targetDate));
	const loadingMessageList = $derived(buildLoadingMessageList(middayWeather));

	let freshResult: { bookings: Booking[]; scrapedAt: string } | null = $state(null);
	let scrapeError: unknown = $state(null);
	let settled = $state(false);
	let suggestion: TimeSuggestion | null = $state(null);

	const bookingList = $derived.by(() => freshResult?.bookings ?? data.bookings);
	const scrapedAt = $derived.by(() => freshResult?.scrapedAt ?? data.scrapedAt);
	const refreshing = $derived.by(() => !!data.fresh && !freshResult && !scrapeError && !settled);

	const fieldChipList: FieldChip[] = $derived(
		FIELD_LIST.map((field) => ({
			id: field.id,
			name: field.name,
			query: buildPageQuery({ date: data.date, fieldId: field.id })
		}))
	);

	// A suggestion belongs to one field — drop it when switching.
	$effect(() => {
		void data.fieldId;
		suggestion = null;
	});

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
	<div class="controls">
		<p class="meta">
			<DateStepper date={targetDate} fieldId={data.fieldId} />
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

		{#if fieldChipList.length > 1}
			<FieldChips chips={fieldChipList} selectedId={data.fieldId} />
		{/if}
	</div>

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
