<script lang="ts">
	import type { PageData } from './$types';
	import Calendar from '$lib/components/Calendar.svelte';
	import type { ParsedWeatherTimeEntry } from '$lib/types';
	import { symbolCodeLabel } from '$lib/weatherLabels';

	export let data: PageData;

	const nextSundayDate = new Date(data.date);

	const calendar = data.calendar;
	const weather = data.weather;

	const sundayWeatherEntries =
		weather?.properties.timeseries
			.map((entry): ParsedWeatherTimeEntry => ({ ...entry, date: new Date(entry.time) }))
			.filter((entry) => entry.date.getDate() === nextSundayDate.getDate()) ?? [];

	const middayWeather = sundayWeatherEntries
		.filter((entry) => entry.data)
		.filter((entry) => entry.date.getHours() >= 11 && entry.date.getHours() <= 14)
		.filter((entry) => entry.data.next_12_hours)
		.toSorted((a, b) => a.date.getHours() - b.date.getHours())[0];

	const middayWeatherSymbol =
		(middayWeather?.data.next_12_hours ?? middayWeather?.data.next_6_hours)?.summary?.symbol_code ??
		null;
	const middayWeatherLabel = (middayWeatherSymbol && symbolCodeLabel[middayWeatherSymbol]) ?? null;
	const middayWeatherTemperature = middayWeather?.data.instant?.details?.air_temperature ?? null;
</script>

<svelte:head>
	<title>E Planen Ledig På Söndag - Söndagsboll ⚽️</title>
</svelte:head>

<main>
	<h1 class="title">Söndagsboll ⚽️</h1>
	<p class="meta">
		<time datetime={nextSundayDate.toDateString()}
			>{nextSundayDate.toLocaleDateString('sv-SE', {
				day: 'numeric',
				month: 'long'
			})}</time
		>
		{#if middayWeather}
			&nbsp;|&nbsp;
			<img
				src="weather-icons/{middayWeatherSymbol}.png"
				alt={middayWeatherLabel ?? middayWeatherSymbol}
			/>

			{#if middayWeatherLabel}
				&nbsp;<small>({middayWeatherLabel})</small>
			{/if}

			&nbsp;
			<span>{middayWeatherTemperature?.toFixed(1)}°</span>
		{/if}
	</p>

	<Calendar calendarEntries={calendar.Data} weatherEntries={sundayWeatherEntries} />
</main>

<style>
	main {
		margin-inline: auto;
		max-width: 50em;
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
