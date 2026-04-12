<script lang="ts">
	import BigLoader from '$lib/components/BigLoader.svelte';
	import Calendar from '$lib/components/Calendar.svelte';
	import type { Booking, ParsedWeatherTimeEntry } from '$lib/types';
	import { symbolCodeLabel } from '$lib/weatherLabels';
	import { tick, onMount } from 'svelte';
	import { browser } from '$app/environment';

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

	type LoadingMessage = string | { text: string; imageUrl: string };

	function shuffleGroups(groups: LoadingMessage[][]): LoadingMessage[] {
		const shuffled = [...groups];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled.flat();
	}

	// Messages that can appear in any order, early on
	const anytime: LoadingMessage[][] = [
		['Kul med fotboll ✨'],
		['Hoppas vi blir många 🤞😮‍💨'],
		['Vem tar med bollen? ⚽️'],
		['Hoppas ingen bokat hela planen 🤞'],
		['Ses på söndag? 👋']
	];

	// Messages that should come later — sequences stay together
	const late: LoadingMessage[][] = [
		['Tar visst lite tid 👀', 'Det är inte mitt fel 😩'],
		['Blazor var ett misstag'],
		['Malmö stad, skaffa ett API 🙏'],
		['Satans blazor 😭'],
		['Nu borde det komma något snart 🤔'],
		['Skulle jag gissa att det kommer krascha 😬']
	];

	const loadingMessages: LoadingMessage[] = [
		'Letar efter lediga tider...',
		...(middayWeatherSymbol
			? [
					{
						text: `Ser ut att bli ${middayWeatherLabel}`,
						imageUrl: `/weather-icons/${middayWeatherSymbol}.png`
					} satisfies LoadingMessage
				]
			: middayWeatherLabel
				? [`Ser ut att bli ${middayWeatherLabel}`]
				: []),
		...shuffleGroups(anytime),
		...shuffleGroups(late),
		'Nu har jag inte fler texter 🙃',
		'Vi börjar om 🥸'
	];

	let bookings: Booking[] | null = data.bookings;
	let scrapedAt: string | null = data.scrapedAt;
	let refreshing = !!data.fresh;
	let scrapeError: unknown = null;

	async function applyUpdate(fresh: { bookings: Booking[]; scrapedAt: string }) {
		const doUpdate = async () => {
			bookings = fresh.bookings;
			scrapedAt = fresh.scrapedAt;
			refreshing = false;
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
				.then((fresh: { bookings: Booking[]; scrapedAt: string }) => applyUpdate(fresh))
				.catch((error: unknown) => {
					scrapeError = error;
					refreshing = false;
				});
		}
	});

	function formatScrapedAt(isoString: string): string {
		const date = new Date(isoString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMin = Math.floor(diffMs / 60000);

		if (diffMin < 1) return 'just nu';
		if (diffMin === 1) return '1 minut sedan';
		if (diffMin < 60) return `${diffMin} minuter sedan`;

		const diffHours = Math.floor(diffMin / 60);
		if (diffHours < 24) {
			if (diffHours === 1) return '1 timme sedan';
			return `${diffHours} timmar sedan`;
		}

		const diffDays = Math.floor(diffHours / 24);
		if (diffDays === 1) return '1 dag sedan';
		return `${diffDays} dagar sedan`;
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
			Hämtades {formatScrapedAt(scrapedAt)}{#if refreshing}<span class="refreshing">
					&middot; Uppdaterar...</span
				>{/if}
		</p>
		<Calendar {bookings} weatherEntries={sundayWeatherEntries} />
	{:else if refreshing}
		<BigLoader messages={loadingMessages} delayMs={4000} />
	{:else}
		<div>
			<h2>Nåt gick riktigt snett 😭.</h2>
			{#if scrapeError}
				<p>Här är felet:</p>
				<code><pre>{JSON.stringify(scrapeError, Object.getOwnPropertyNames(scrapeError), 2)}</pre></code>
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

	.freshness {
		font-size: 0.75rem;
		opacity: 0.6;
		margin-block: 0 1rem;
	}

	.refreshing {
		animation: pulse 1.5s ease-in-out infinite;
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
