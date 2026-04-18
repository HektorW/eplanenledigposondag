<script lang="ts">
	import { minutesToGridRow } from '$lib/calendar';
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
		return {
			start: formattedTimeToMinutes(entry.startTimeFormatted),
			end: formattedTimeToMinutes(entry.endTimeFormatted)
		};
	}
</script>

{#snippet renderBookingEntries(entries: Booking[], column: string)}
	{#each entries as entry (entry.bookingId)}
		{@const minutes = getMinutes(entry)}
		{@const startRow = minutesToGridRow(minutes.start)}
		{@const endRow = minutesToGridRow(minutes.end)}

		<article
			class="booking-entry"
			style:grid-column={column}
			style:grid-row={`${startRow} / ${endRow}`}
		>
			{#if 'bookedBy' in entry}
				<h3 class="booking-entry--name">{entry.bookedBy}</h3>
			{/if}

			<div class="booking-entry--time">
				{print24HourTime(minutes.start)} - {print24HourTime(minutes.end)}
			</div>
		</article>
	{/each}
{/snippet}

{@render renderBookingEntries(halfCourtAEntries, '2')}
{@render renderBookingEntries(halfCourtBEntries, '3')}
{@render renderBookingEntries(fullCourtEntries, '2 / 4')}

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
