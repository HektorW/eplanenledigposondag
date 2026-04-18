<script lang="ts">
	import { fullCourtId, halfCourtAId, halfCourtBId } from '$lib/ids';
	import type { Booking, ParsedWeatherTimeEntry, TimeSuggestion } from '$lib/types';
	import { formattedTimeToMinutes } from '$lib/utils';
	import Bookings from './Bookings.svelte';
	import SuggestedTime from './SuggestedTime.svelte';
	import TimeAxis from './TimeAxis.svelte';

	type CalendarProps = {
		bookings: Booking[];
		weatherEntries: ParsedWeatherTimeEntry[];
		suggestion?: TimeSuggestion | null;
	};

	let { bookings, weatherEntries, suggestion = $bindable(null) }: CalendarProps = $props();

	const defaultDuration = 60;

	function hasConflict(court: 'a' | 'b', startMinutes: number, durationMinutes: number): boolean {
		const courtId = court === 'a' ? halfCourtAId : halfCourtBId;
		return bookings.some((booking) => {
			if (booking.resourceId !== courtId && booking.resourceId !== fullCourtId) return false;
			const bookingStart = formattedTimeToMinutes(booking.startTimeFormatted);
			const bookingEnd = formattedTimeToMinutes(booking.endTimeFormatted);
			return startMinutes < bookingEnd && startMinutes + durationMinutes > bookingStart;
		});
	}

	function handleCourtClick(court: 'a' | 'b', event: MouseEvent) {
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const y = event.clientY - rect.top;
		const rowHeight = rect.height / 40;
		const rowIndex = Math.floor(y / rowHeight);
		const clickedMinutes = 9 * 60 + rowIndex * 15;

		// Center the suggestion around the click point
		const centered = clickedMinutes - Math.floor(defaultDuration / 2 / 15) * 15;
		const clamped = Math.max(9 * 60, Math.min(centered, 19 * 60 - defaultDuration));

		if (hasConflict(court, clamped, defaultDuration)) return;

		suggestion = { startMinutes: clamped, durationMinutes: defaultDuration, court };
	}
</script>

<section class:has-suggestion={!!suggestion}>
	<header>
		<h2>Ena halvan</h2>
		<h2>Andra halvan</h2>
	</header>

	<TimeAxis {weatherEntries} />

	<!-- Click targets for placing suggestions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="click-target"
		style:grid-column="2"
		style:grid-row="2 / -1"
		onclick={(e) => handleCourtClick('a', e)}
	></div>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="click-target"
		style:grid-column="3"
		style:grid-row="2 / -1"
		onclick={(e) => handleCourtClick('b', e)}
	></div>

	<Bookings {bookings} />

	{#if suggestion}
		<SuggestedTime {suggestion} />
	{/if}
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

		&.has-suggestion {
			padding-bottom: 10rem;
		}
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

	.click-target {
		cursor: pointer;
		border-radius: var(--border-radius--100);

		&:hover {
			background: hsl(from var(--c--main--text) h s l / 0.04);
		}
	}
</style>
