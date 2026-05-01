<script lang="ts">
	import {
		CALENDAR_END_MINUTES,
		CALENDAR_ROWS,
		CALENDAR_START_MINUTES,
		CALENDAR_STEP_MINUTES,
		COURT_GRID_COLUMN,
		COURT_ID_LIST,
		COURT_LABEL,
		DEFAULT_SUGGESTION_DURATION_MINUTES,
		FALLBACK_SUGGESTION_DURATION_MINUTES,
		hasConflict
	} from '$lib/calendar';
	import type { Booking, Court, ParsedWeatherTimeEntry, TimeSuggestion } from '$lib/types';
	import Bookings from './Bookings.svelte';
	import SuggestedTime from './SuggestedTime.svelte';
	import TimeAxis from './TimeAxis.svelte';

	type CalendarProps = {
		bookings: Booking[];
		weatherEntries: ParsedWeatherTimeEntry[];
		suggestion?: TimeSuggestion | null;
	};

	let { bookings, weatherEntries, suggestion = $bindable(null) }: CalendarProps = $props();

	function tryPlaceSuggestion(
		court: Court,
		clickedMinutes: number,
		durationMinutes: number
	): TimeSuggestion | null {
		const halfDurationSteps = Math.floor(durationMinutes / 2 / CALENDAR_STEP_MINUTES);
		const centered = clickedMinutes - halfDurationSteps * CALENDAR_STEP_MINUTES;
		const clamped = Math.max(
			CALENDAR_START_MINUTES,
			Math.min(centered, CALENDAR_END_MINUTES - durationMinutes)
		);
		if (hasConflict(bookings, court, clamped, durationMinutes)) return null;
		return { startMinutes: clamped, durationMinutes, court };
	}

	function handleCourtClick(court: Court, event: MouseEvent) {
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const parent = target.parentElement;
		const gap = parent ? parseFloat(getComputedStyle(parent).rowGap) || 0 : 0;
		const rowHeight = (rect.height - (CALENDAR_ROWS - 1) * gap) / CALENDAR_ROWS;
		const y = event.clientY - rect.top;
		const rowIndex = Math.max(0, Math.min(CALENDAR_ROWS - 1, Math.floor(y / (rowHeight + gap))));
		const clickedMinutes = CALENDAR_START_MINUTES + rowIndex * CALENDAR_STEP_MINUTES;

		const placed =
			tryPlaceSuggestion(court, clickedMinutes, DEFAULT_SUGGESTION_DURATION_MINUTES) ??
			tryPlaceSuggestion(court, clickedMinutes, FALLBACK_SUGGESTION_DURATION_MINUTES);
		if (placed) suggestion = placed;
	}
</script>

<section class:has-suggestion={!!suggestion} style:--row--count={CALENDAR_ROWS}>
	<header>
		{#each COURT_ID_LIST as court (court)}
			<h2 style:grid-column={COURT_GRID_COLUMN[court]}>{COURT_LABEL[court]}</h2>
		{/each}
	</header>

	<TimeAxis {weatherEntries} />

	{#each COURT_ID_LIST as court (court)}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="click-target"
			data-testid="court-click-target-{court}"
			style:grid-column={COURT_GRID_COLUMN[court]}
			style:grid-row="2 / -1"
			onclick={(event) => handleCourtClick(court, event)}
		></div>
	{/each}

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
			padding-bottom: calc(var(--share-panel-height, 8rem) + 2rem);
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
