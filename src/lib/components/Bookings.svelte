<script lang="ts">
	import {
		CALENDAR_STEP_MINUTES,
		clampToCalendar,
		COMPACT_BOOKING_MAX_MINUTES,
		COURT_GRID_COLUMN,
		FULL_COURT_GRID_COLUMN,
		minutesToGridRow,
		snapToGridStep
	} from '$lib/calendar';
	import { fullCourtId, halfCourtAId, halfCourtBId } from '$lib/ids';
	import type { Booking } from '$lib/types';
	import { formattedTimeToMinutes, print24HourTime } from '$lib/utils';

	type BookingsProps = {
		bookings: Booking[];
	};

	const { bookings }: BookingsProps = $props();

	const halfCourtAEntries = $derived(bookings.filter((entry) => entry.resourceId === halfCourtAId));
	const halfCourtBEntries = $derived(bookings.filter((entry) => entry.resourceId === halfCourtBId));
	const fullCourtEntries = $derived(bookings.filter((entry) => entry.resourceId === fullCourtId));

	function getMinutes(entry: Booking) {
		const start = formattedTimeToMinutes(entry.startTimeFormatted);
		const end = formattedTimeToMinutes(entry.endTimeFormatted);
		const visible = clampToCalendar(start, end, { clampEnd: false });
		return { start, end, visible: visible && snapToGridStep(visible) };
	}
</script>

{#snippet renderBookingEntries(entries: Booking[], column: string)}
	{#each entries as entry (entry.bookingId)}
		{@const minutes = getMinutes(entry)}
		{#if minutes.visible}
			<article
				class="booking-entry"
				class:booking-entry--compact={minutes.visible.end - minutes.visible.start <
					COMPACT_BOOKING_MAX_MINUTES}
				class:booking-entry--single-line={minutes.visible.end - minutes.visible.start <=
					CALENDAR_STEP_MINUTES}
				style:grid-column={column}
				style:grid-row={`${minutesToGridRow(minutes.visible.start)} / ${minutesToGridRow(minutes.visible.end)}`}
			>
				{#if 'bookedBy' in entry}
					<h3 class="booking-entry--name">{entry.bookedBy}</h3>
				{/if}

				<!-- Real times, even when the block is clamped or snapped to the grid -->
				<div class="booking-entry--time">
					{print24HourTime(minutes.start)} - {print24HourTime(minutes.end)}
				</div>
			</article>
		{/if}
	{/each}
{/snippet}

{@render renderBookingEntries(halfCourtAEntries, COURT_GRID_COLUMN.a)}
{@render renderBookingEntries(halfCourtBEntries, COURT_GRID_COLUMN.b)}
{@render renderBookingEntries(fullCourtEntries, FULL_COURT_GRID_COLUMN)}

<style lang="scss">
	@use '../styles/calendar-block' as block;

	.booking-entry {
		@include block.base;

		background-color: var(--c--booking--background);
		color: var(--c--booking--text);
		box-shadow: var(--box-shadow--booking);

		&--name {
			@include block.primary;
			font-weight: 600;
		}

		&--time {
			@include block.secondary;
		}
	}

	// Under an hour the regular padding doesn't leave room for name + time.
	// Tighten it and keep the name to one line.
	.booking-entry--compact {
		line-height: 1.1;
		overflow: hidden;
		padding-block: 0.3rem;

		.booking-entry--name {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.booking-entry--time {
			margin-top: 0.1rem;
			white-space: nowrap;
		}
	}

	// A single row (15 min) only fits one line — name and time share it and
	// the name gives way first.
	.booking-entry--single-line {
		align-items: center;
		display: flex;
		gap: 0.5em;
		line-height: 1;
		padding-block: 0.15rem;

		.booking-entry--name {
			min-width: 0;
		}

		.booking-entry--time {
			flex-shrink: 0;
			margin-top: 0;
		}
	}
</style>
