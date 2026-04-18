<script lang="ts">
	import { minutesToGridRow } from '$lib/calendar';
	import type { TimeSuggestion } from '$lib/types';
	import { print24HourTime } from '$lib/utils';

	type Props = {
		suggestion: TimeSuggestion;
	};

	const { suggestion }: Props = $props();

	const startRow = $derived(minutesToGridRow(suggestion.startMinutes));
	const endRow = $derived(minutesToGridRow(suggestion.startMinutes + suggestion.durationMinutes));
	const column = $derived(suggestion.court === 'a' ? '2' : '3');
</script>

<div class="suggestion" style:grid-column={column} style:grid-row="{startRow} / {endRow}">
	<div class="suggestion--label">Spela här?</div>
	<div class="suggestion--time">
		{print24HourTime(suggestion.startMinutes)} – {print24HourTime(
			suggestion.startMinutes + suggestion.durationMinutes
		)}
	</div>
</div>

<style lang="scss">
	.suggestion {
		background-color: var(--c--suggestion--background, #e06468);
		border: 2px dashed var(--c--suggestion--border, #c04a4e);
		color: #fff;

		border-radius: var(--border-radius--100);

		padding: 0.75rem;
		z-index: 1;

		&--label {
			font-size: 0.8rem;
			font-weight: 700;
			margin: 0;
		}

		&--time {
			font-size: 0.7rem;
			font-weight: 400;
			margin-top: 0.2em;
		}
	}
</style>
