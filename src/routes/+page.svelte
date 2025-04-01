<script lang="ts">
	import BigLoader from '$lib/components/BigLoader.svelte';
	import Calendar from '$lib/components/Calendar.svelte';
	import type { ParsedWeatherTimeEntry } from '$lib/types';
	import { symbolCodeLabel } from '$lib/weatherLabels';

	export let data;

	const nextSundayDate = new Date(data.date);

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

	const loadingMessages: Array<string | { text: string; imageUrl: string }> = [
		'Letar efter lediga tider...'
	];

	if (middayWeatherLabel) {
		const text = `Ser ut att bli ${middayWeatherLabel}`;

		if (middayWeatherSymbol) {
			loadingMessages.push({
				text: `Ser ut att bli ${middayWeatherLabel}`,
				imageUrl: `/weather-icons/${middayWeatherSymbol}.png`
			});
		} else {
			loadingMessages.push(text);
		}
	}

	loadingMessages.push(
		'Kul med fotboll ✨',
		'Hoppas vi blir många 🤞😮‍💨',
		'Tar visst lite tid 👀',
		'Det är inte mitt fel 😩',
		'Satans blazor 😭',
		'Ses på söndag? 👋',
		'Nu borde det komma något snart 🤔',
		'Skulle jag gissa att det kommer krascha 😬',
		'Nu har jag inte fler texter 🙃',
		'Vi börjar om 🥸'
	);
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

	{#await data.calendar}
		<BigLoader messages={loadingMessages} />
	{:then calendar}
		<Calendar bookings={calendar} weatherEntries={sundayWeatherEntries} />
	{:catch error}
		<div>
			<h2>Nåt gick riktigt snett 😭.</h2>

			<p>Här är felet:</p>
			<code><pre>{JSON.stringify(error, null, 2)}</pre></code>

			<p>
				Skriv till Hektor eller ännu bättre lägg en PR <a
					href="https://github.com/HektorW/eplanenledigposondag"
					target="_blank">https://github.com/HektorW/eplanenledigposondag</a
				>
			</p>
		</div>
	{/await}
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
