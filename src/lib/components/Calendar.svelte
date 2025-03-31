<script lang="ts">
	import type { Booking, ParsedWeatherTimeEntry } from '$lib/types';
	import Bookings from './Bookings.svelte';
	// import SuggestedTime from './SuggestedTime.svelte';
	import TimeAxis from './TimeAxis.svelte';

	type CalendarProps = {
		bookings: Booking[];
		weatherEntries: ParsedWeatherTimeEntry[];
	};

	const { bookings, weatherEntries }: CalendarProps = $props();

	function onGridClick(event: MouseEvent) {}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<section onclick={onGridClick}>
	<header>
		<h2>Ena halvan</h2>
		<h2>Andra halvan</h2>
	</header>

	<TimeAxis {weatherEntries} />

	<Bookings {bookings} />

	<!-- <SuggestedTime /> -->
</section>

<style lang="scss">
	section {
		--columns: 4.5rem 1fr 1fr;

		--row--height: 1.1rem;
		--row--count: 40; // 10 hours * 4 quarters

		--header--gap: 1rem;
		--column--gap: 0.5rem;
		--row--gap: 0.25rem;
		--line--offset: 0.2rem; // Offsets slightly underneath bookings

		display: grid;
		grid-template-columns: var(--columns);
		grid-template-rows: auto // header
			repeat(var(--row--count), var(--row--height));

		column-gap: var(--column--gap);
		row-gap: var(--row--gap);
	}

	header {
		grid-column: 1 / -1;

		margin-bottom: var(--header--gap);

		display: grid;
		grid-template-columns: subgrid;

		h2 {
			font-size: 1rem;
			font-weight: 700;
			margin: 0;

			&:first-child {
				grid-column: 2;
			}

			&:last-child {
				grid-column: 3;
			}
		}
	}
</style>
