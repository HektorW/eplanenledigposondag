<script>
	import { page } from "$app/stores";
	import { print24HourTime } from '$lib/utils'

	const nextSundayDate = new Date($page.data.date)

	const fullCourtBookings = $page.data.reserved.ReserveradeTider.filter((item) => item.ResursIndex === 0)
	const halfCourtABookings = $page.data.reserved.ReserveradeTider.filter((item) => item.ResursIndex === 1)
	const halfCourtBBookings = $page.data.reserved.ReserveradeTider.filter((item) => item.ResursIndex === 2)
</script>

<svelte:head>
	<title>E Planen Ledig På Söndag - Söndagsboll ⚽️</title>
</svelte:head>

<main>
	<h1>Söndagsboll ⚽️ </h1>
	<h2>{nextSundayDate.toLocaleDateString('sv-SE', {
		day: 'numeric',
		month: 'short'
	})}</h2>

	<section class="header">
		<div />
		<div>Fullplan</div>
		<div>Ena halvan</div>
		<div>Andra halvan</div>
	</section>

	<section class="grid">
		<div class="time-axis">
			<div>9.00</div>
			<div>10.00</div>
			<div>11.00</div>
			<div>12.00</div>
			<div>13.00</div>
			<div>14.00</div>
			<div>15.00</div>
			<div>16.00</div>
			<div>17.00</div>
		</div>

		{#each fullCourtBookings as item}
			{@const startRow = (item.StartMinut / 15) - 35}
			{@const endRow = (item.SlutMinut / 15) - 35}

			<div
				class="booking"
				style:grid-column="2"
				style:grid-row={`${startRow} / ${endRow}`}
			>{print24HourTime(item.StartMinut)} - {print24HourTime(item.SlutMinut)}</div>
		{/each}

		{#each halfCourtABookings as item}
			{@const startRow = (item.StartMinut / 15) - 35}
			{@const endRow = (item.SlutMinut / 15) - 35}

			<div
				class="booking"
				style:grid-column="3"
				style:grid-row={`${startRow} / ${endRow}`}
			>{print24HourTime(item.StartMinut)} - {print24HourTime(item.SlutMinut)}</div>
		{/each}

		{#each halfCourtBBookings as item}
			{@const startRow = (item.StartMinut / 15) - 35}
			{@const endRow = (item.SlutMinut / 15) - 35}

			<div
				class="booking"
				style:grid-column="4"
				style:grid-row={`${startRow} / ${endRow}`}
			>{print24HourTime(item.StartMinut)} - {print24HourTime(item.SlutMinut)}</div>
		{/each}
	</section>

	<!-- <code>
		<pre>{JSON.stringify($page.data.reserved, null, 2)}</pre>
	</code>

	<code>
		<pre>{JSON.stringify($page.data.calendar, null, 2)}</pre>
	</code> -->
</main>

<style>
	:root {
		--background: #fff;
		--text: #333;

		--grid-columns: 4em 1fr 1fr 1fr;
	}

	:global(*, *::after, *::before) {
		box-sizing: border-box;
	}

	:global(body) {
		background-color: var(--background);
		color: var(--text);
	}

	.header {
		display: grid;
		grid-template-columns: var(--grid-columns);
	}

	.grid {
		display: grid;
		grid-template-columns: var(--grid-columns);
		grid-template-rows: repeat(36, 1em);
	}
	
	.time-axis {
		grid-column: 1;
		grid-row: 1 / -1;

		display: grid;
		grid-template-rows: repeat(9, 1fr);
	}

	.booking {
		background-color: antiquewhite;
	}
</style>
