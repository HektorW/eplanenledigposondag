<script lang="ts">
	import {
		clampToCalendar,
		COURT_GRID_COLUMN,
		FULL_COURT_GRID_COLUMN,
		minutesToGridRow
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
		return { start, end, visible: clampToCalendar(start, end) };
	}
</script>

{#snippet renderBookingEntries(entries: Booking[], column: string)}
	{#each entries as entry (entry.bookingId)}
		{@const minutes = getMinutes(entry)}
		{#if minutes.visible}
			<article
				class="booking-entry"
				style:grid-column={column}
				style:grid-row={`${minutesToGridRow(minutes.visible.start)} / ${minutesToGridRow(minutes.visible.end)}`}
			>
				{#if 'bookedBy' in entry}
					<h3 class="booking-entry--name">{entry.bookedBy}</h3>
				{/if}

				<!-- Real times, even when the block is clamped to the visible hours -->
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
</style>
