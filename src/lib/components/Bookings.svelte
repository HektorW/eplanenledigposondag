<script lang="ts">
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
		{@const startRow = Math.round(minutes.start / 15) - 34}
		{@const endRow = Math.round(minutes.end / 15) - 34}

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
	.booking-entry {
		background-color: var(--c--booking--background);
		color: var(--c--booking--text);
		box-shadow: var(--box-shadow--booking);

		border-radius: var(--border-radius--100);

		padding: 0.75rem;

		&--name {
			font-size: 0.8rem;
			font-weight: 600;
			margin: 0;
		}

		&--time {
			font-size: 0.7rem;
			font-weight: 400;
			margin-top: 0.2em;
		}
	}
</style>
