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
	@use '../styles/calendar-block' as block;

	.suggestion {
		@include block.base;

		background-color: var(--c--suggestion--background);
		border: 2px dashed var(--c--suggestion--border);
		color: var(--c--suggestion--text);
		z-index: 1;

		&--label {
			@include block.primary;
			font-weight: 700;
		}

		&--time {
			@include block.secondary;
		}
	}
</style>
