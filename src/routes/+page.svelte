<script>
	import { page } from "$app/stores";
	import { fullCourtId, halfCourtAId, halfCourtBId } from "$lib/ids";
	import Bookings from "./Bookings.svelte";
	import TimeAxisEntry from "./TimeAxisEntry.svelte";

	const nextSundayDate = new Date($page.data.date)

	/** @type {import('$lib/types').CalendarResponse} */
	const calendar = $page.data.calendar;

	/** @type {import('$lib/types').WeatherResponseData | null} */
	const weather = $page.data.weather;

	const sundayWeatherEntries = weather?.properties.timeseries
		.map((entry) => ({ ...entry, date: new Date(entry.time) }))
		.filter((entry) => entry.date.getDate() === nextSundayDate.getDate())
		?? []
</script>

<svelte:head>
	<title>E Planen Ledig På Söndag - Söndagsboll ⚽️</title>
</svelte:head>

<main>
	<h1>Söndagsboll ⚽️ </h1>
	<h2>Nästa söndag: {nextSundayDate.toLocaleDateString('sv-SE', {
		day: 'numeric',
		month: 'short'
	})}</h2>

	<!-- <code>
		<pre>{JSON.stringify(sundayWeatherEntries, null, 2)}</pre>
	</code> -->

	<section class="header">
		<div></div>
		<div>Ena halvan</div>
		<div>Andra halvan</div>
	</section>

	<section class="grid">
		<div class="time-axis">
			<TimeAxisEntry hour={9} {sundayWeatherEntries} />
			<TimeAxisEntry hour={10} {sundayWeatherEntries} />
			<TimeAxisEntry hour={11} {sundayWeatherEntries} />
			<TimeAxisEntry hour={12} {sundayWeatherEntries} />
			<TimeAxisEntry hour={13} {sundayWeatherEntries} />
			<TimeAxisEntry hour={14} {sundayWeatherEntries} />
			<TimeAxisEntry hour={15} {sundayWeatherEntries} />
			<TimeAxisEntry hour={16} {sundayWeatherEntries} />
			<TimeAxisEntry hour={17} {sundayWeatherEntries} />
			<!-- <div>10:00</div>
			<div>11:00</div>
			<div>12:00</div>
			<div>13:00</div>
			<div>14:00</div>
			<div>15:00</div>
			<div>16:00</div>
			<div>17:00</div> -->
		</div>

		<Bookings
			bookings={calendar.Data.filter((item) => item.Resurs === halfCourtAId)}
			column="2"
		/>

		<Bookings
			bookings={calendar.Data.filter((item) => item.Resurs === halfCourtBId)}
			column="3"
		/>

		<Bookings
			bookings={calendar.Data.filter((item) => item.Resurs === fullCourtId)}
			column="2 / 4"
		/>
	</section>
</main>

<style>
	:root {
		--background: #fff;
		--text: #333;

		--border-color: #333;

		--grid-free: #b6ffb7;
		--grid-booked: #ff7e7e;

		--grid-columns: 4em 1fr 1fr;
	}

	@media (prefers-color-scheme: dark) {
		:root {
			--background: #333;
			--text: #fff;

			--grid-free: #8bffa9;
			--grid-booked: #ff8080;
		}
	}

	:global(*, *::after, *::before) {
		box-sizing: border-box;
	}

	:global(body) {
		background-color: var(--background);
		color: var(--text);
	}

	main {
		margin-inline: auto;
		max-width: 60em;
	}

	.header {
		display: grid;
		grid-template-columns: var(--grid-columns);		
	}

	.grid {
		display: grid;
		grid-template-columns: var(--grid-columns);
		grid-template-rows: repeat(36, 1.25em);

		background-color: var(--grid-free);
	}
	
	.time-axis {
		grid-column: 1;
		grid-row: 1 / -1;

		display: grid;
		grid-template-rows: repeat(9, 1fr);

		background-color: var(--background);
		text-align: right;
		padding-inline-end: 0.5em;
	}
</style>
