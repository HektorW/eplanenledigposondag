<script lang="ts">
	import type { TimeSuggestion } from '$lib/types';
	import { print24HourTime } from '$lib/utils';

	type Props = {
		suggestion: TimeSuggestion;
	};

	const { suggestion }: Props = $props();

	const startRow = $derived(suggestion.startMinutes / 15 - 34);
	const endRow = $derived((suggestion.startMinutes + suggestion.durationMinutes) / 15 - 34);
	const column = $derived(suggestion.court === 'a' ? '2' : '3');
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="suggestion"
	style:grid-column={column}
	style:grid-row="{startRow} / {endRow}"
	onclick={(e) => e.stopPropagation()}
>
	<div class="suggestion--label">Spela här?</div>
	<div class="suggestion--time">
		{print24HourTime(suggestion.startMinutes)} – {print24HourTime(suggestion.startMinutes + suggestion.durationMinutes)}
	</div>
</div>

<style lang="scss">
	.suggestion {
		background-color: var(--c--suggestion--background, hsl(145, 63%, 42%));
		border: 2px dashed var(--c--suggestion--border, hsl(145, 63%, 32%));
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
