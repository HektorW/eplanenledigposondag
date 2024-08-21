<script lang="ts">
	import { fullCourtId, halfCourtAId, halfCourtBId } from '$lib/ids';
	import type { CalendarEntry } from '$lib/types';
	import { dateStrToMinutes, print24HourTime } from '$lib/utils';

	type BookingsProps = {
		calendarEntries: CalendarEntry[];
	};

	const { calendarEntries }: BookingsProps = $props();

	const halfCourtAEntries = calendarEntries.filter((entry) => entry.Resurs === halfCourtAId);
	const halfCourtBEntries = calendarEntries.filter((entry) => entry.Resurs === halfCourtBId);
	const fullCourtEntries = calendarEntries.filter((entry) => entry.Resurs === fullCourtId);

	function getMinutes(entry: CalendarEntry) {
		return {
			start: dateStrToMinutes(entry.Start),
			end: dateStrToMinutes(entry.End)
		};
	}
</script>

{#snippet renderBookingEntries(entries: CalendarEntry[], column: string)}
	{#each entries as entry}
		{@const minutes = getMinutes(entry)}
		{@const startRow = minutes.start / 15 - 34}
		{@const endRow = minutes.end / 15 - 34}

		<article
			class="booking-entry"
			style:grid-column={column}
			style:grid-row={`${startRow} / ${endRow}`}
		>
			{#if 'BokadAv' in entry}
				<h3 class="booking-entry--name">{entry.BokadAv}</h3>
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
