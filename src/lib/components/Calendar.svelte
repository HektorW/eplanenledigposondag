<script lang="ts">
	import {
		CALENDAR_END_MINUTES,
		CALENDAR_ROWS,
		CALENDAR_START_MINUTES,
		CALENDAR_STEP_MINUTES,
		DEFAULT_SUGGESTION_DURATION_MINUTES,
		hasConflict
	} from '$lib/calendar';
	import type { Booking, ParsedWeatherTimeEntry, TimeSuggestion } from '$lib/types';
	import Bookings from './Bookings.svelte';
	import SuggestedTime from './SuggestedTime.svelte';
	import TimeAxis from './TimeAxis.svelte';

	type CalendarProps = {
		bookings: Booking[];
		weatherEntries: ParsedWeatherTimeEntry[];
		suggestion?: TimeSuggestion | null;
	};

	let { bookings, weatherEntries, suggestion = $bindable(null) }: CalendarProps = $props();

	function handleCourtClick(court: 'a' | 'b', event: MouseEvent) {
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const y = event.clientY - rect.top;
		const rowHeight = rect.height / CALENDAR_ROWS;
		const rowIndex = Math.floor(y / rowHeight);
		const clickedMinutes = CALENDAR_START_MINUTES + rowIndex * CALENDAR_STEP_MINUTES;

		const halfDurationSteps = Math.floor(
			DEFAULT_SUGGESTION_DURATION_MINUTES / 2 / CALENDAR_STEP_MINUTES
		);
		const centered = clickedMinutes - halfDurationSteps * CALENDAR_STEP_MINUTES;
		const clamped = Math.max(
			CALENDAR_START_MINUTES,
			Math.min(centered, CALENDAR_END_MINUTES - DEFAULT_SUGGESTION_DURATION_MINUTES)
		);

		if (hasConflict(bookings, court, clamped, DEFAULT_SUGGESTION_DURATION_MINUTES)) return;

		suggestion = {
			startMinutes: clamped,
			durationMinutes: DEFAULT_SUGGESTION_DURATION_MINUTES,
			court
		};
	}
</script>

<section class:has-suggestion={!!suggestion} style:--row--count={CALENDAR_ROWS}>
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
