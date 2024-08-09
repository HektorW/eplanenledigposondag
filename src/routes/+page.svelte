<script>
	import { page } from "$app/stores";
	import { fullCourtId, halfCourtAId, halfCourtBId } from "$lib/ids";
	import Bookings from "./Bookings.svelte";

	const nextSundayDate = new Date($page.data.date)

	/** @type {import('$lib/types').CalendarResponse} */
	const calendar = $page.data.calendar;
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

	<section class="header">
		<div />
		<div>Ena halvan</div>
		<div>Andra halvan</div>
	</section>

	<section class="grid">
		<div class="time-axis">
			<div>9:00</div>
			<div>10:00</div>
			<div>11:00</div>
			<div>12:00</div>
			<div>13:00</div>
			<div>14:00</div>
			<div>15:00</div>
			<div>16:00</div>
			<div>17:00</div>
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

		--grid-columns: 3em 1fr 1fr;
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
		grid-template-rows: repeat(36, 1em);

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
