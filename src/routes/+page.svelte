<script lang="ts">
	import BigLoader from '$lib/components/BigLoader.svelte';
	import Calendar from '$lib/components/Calendar.svelte';
	import type { Booking, ParsedWeatherTimeEntry } from '$lib/types';
	import { symbolCodeLabel } from '$lib/weatherLabels';
	import { tick } from 'svelte';

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
		if (middayWeatherSymbol) {
			loadingMessages.push({
				text: `Ser ut att bli ${middayWeatherLabel}`,
				imageUrl: `/weather-icons/${middayWeatherSymbol}.png`
			});
		} else {
			loadingMessages.push(`Ser ut att bli ${middayWeatherLabel}`);
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

	let bookings: Booking[] | null = data.bookings;
	let scrapedAt: string | null = data.scrapedAt;
	let refreshing = !!data.fresh;

	async function applyUpdate(fresh: { bookings: Booking[]; scrapedAt: string }) {
		const doUpdate = async () => {
			bookings = fresh.bookings;
			scrapedAt = fresh.scrapedAt;
			refreshing = false;
			await tick();
		};

		if (document.startViewTransition) {
			document.startViewTransition(() => doUpdate());
		} else {
			await doUpdate();
		}
	}

	if (data.fresh) {
		data.fresh
			.then((fresh: { bookings: Booking[]; scrapedAt: string }) => applyUpdate(fresh))
			.catch(() => {
				refreshing = false;
			});
	}

	function triggerRefresh() {
		window.location.reload();
	}

	function formatScrapedAt(isoString: string): string {
		const date = new Date(isoString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMin = Math.floor(diffMs / 60000);

		if (diffMin < 1) return 'just nu';
		if (diffMin === 1) return '1 minut sedan';
		if (diffMin < 60) return `${diffMin} minuter sedan`;

		const diffHours = Math.floor(diffMin / 60);
		if (diffHours === 1) return '1 timme sedan';
		return `${diffHours} timmar sedan`;
	}
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

	{#if bookings && scrapedAt}
		<p class="freshness">
			Hämtades {formatScrapedAt(scrapedAt)}
			{#if refreshing}
				<span class="refreshing">&middot; Uppdaterar...</span>
			{:else}
				<button class="refresh-btn" onclick={triggerRefresh}>Uppdatera</button>
			{/if}
		</p>
		<Calendar {bookings} weatherEntries={sundayWeatherEntries} />
	{:else if refreshing}
		<BigLoader messages={loadingMessages} />
	{:else}
		<div>
			<h2>Nåt gick riktigt snett 😭.</h2>
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

	.freshness {
		font-size: 0.75rem;
		opacity: 0.6;
		margin-block: 0 1rem;
	}

	.refreshing {
		animation: pulse 1.5s ease-in-out infinite;
	}

	.refresh-btn {
		all: unset;
		cursor: pointer;
		margin-left: 0.5em;
		text-decoration: underline;
		text-decoration-style: dotted;
		text-underline-offset: 2px;

		&:hover {
			opacity: 1;
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}
</style>
