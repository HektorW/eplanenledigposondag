<script lang="ts">
	import type { Booking, TimeSuggestion } from '$lib/types';
	import { print24HourTime } from '$lib/utils';
	import { generateShareImage } from '$lib/shareImage';
	import { cubicOut } from 'svelte/easing';

	type Props = {
		suggestion: TimeSuggestion;
		bookings: Booking[];
		date: Date;
		onclose: () => void;
		onadjust: (suggestion: TimeSuggestion) => void;
	};

	const { suggestion, bookings, date, onclose, onadjust }: Props = $props();

	const startTime = $derived(print24HourTime(suggestion.startMinutes));
	const endTime = $derived(print24HourTime(suggestion.startMinutes + suggestion.durationMinutes));
	const courtLabel = $derived(suggestion.court === 'a' ? 'Ena halvan' : 'Andra halvan');

	let sharing = $state(false);

	function adjustStart(delta: number) {
		const newStart = suggestion.startMinutes + delta;
		if (newStart >= 9 * 60 && newStart + suggestion.durationMinutes <= 19 * 60) {
			onadjust({ ...suggestion, startMinutes: newStart });
		}
	}

	function adjustDuration(delta: number) {
		const newDuration = suggestion.durationMinutes + delta;
		if (newDuration >= 30 && suggestion.startMinutes + newDuration <= 19 * 60) {
			onadjust({ ...suggestion, durationMinutes: newDuration });
		}
	}

	async function share() {
		sharing = true;
		try {
			const blob = await generateShareImage({ date, bookings, suggestion });
			const file = new File([blob], 'sondagsboll.png', { type: 'image/png' });

			if (navigator.canShare?.({ files: [file] })) {
				await navigator.share({ files: [file] });
			} else {
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'sondagsboll.png';
				a.click();
				URL.revokeObjectURL(url);
			}
		} finally {
			sharing = false;
		}
	}

	function panelIn(_node: Element) {
		return {
			duration: 450,
			easing: cubicOut,
			css: (t: number) => {
				const y = (1 - t) * 100;
				const blur = (1 - t) * 4;
				return `transform: translateY(${y}%); opacity: ${t}; filter: blur(${blur}px)`;
			}
		};
	}

	function panelOut(_node: Element) {
		return {
			duration: 300,
			easing: cubicOut,
			css: (t: number) => {
				const y = (1 - t) * 12;
				const blur = (1 - t) * 4;
				return `transform: translateY(${y}px); opacity: ${t}; filter: blur(${blur}px)`;
			}
		};
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="share-panel-backdrop" onclick={onclose} in:panelIn out:panelOut>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="share-panel" onclick={(e) => e.stopPropagation()}>
		<div class="share-panel--header">
			<h3 class="share-panel--title">Tidsförslag</h3>
			<button class="share-panel--close" onclick={onclose} aria-label="Stäng">✕</button>
		</div>

		<div class="share-panel--info">
			<span class="share-panel--court">{courtLabel}</span>
		</div>

		<div class="share-panel--controls">
			<div class="time-adjust">
				<button
					class="time-adjust--btn"
					onclick={() => adjustStart(-15)}
					aria-label="Tidigare starttid"
				>
					◀
				</button>
				<span class="time-adjust--value">{startTime}</span>
				<button
					class="time-adjust--btn"
					onclick={() => adjustStart(15)}
					aria-label="Senare starttid"
				>
					▶
				</button>

				<span class="time-adjust--separator">–</span>

				<button
					class="time-adjust--btn"
					onclick={() => adjustDuration(-15)}
					aria-label="Kortare tid"
				>
					◀
				</button>
				<span class="time-adjust--value">{endTime}</span>
				<button class="time-adjust--btn" onclick={() => adjustDuration(15)} aria-label="Längre tid">
					▶
				</button>
			</div>
		</div>

		<button class="share-panel--share-btn" onclick={share} disabled={sharing}>
			{#if sharing}
				Skapar bild…
			{:else}
				Dela bild
			{/if}
		</button>
	</div>
</div>

<style lang="scss">
	.share-panel-backdrop {
		position: fixed;
		inset: 0;
		z-index: 10;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.share-panel {
		background: var(--c--surface--raised);
		border-top-left-radius: 16px;
		border-top-right-radius: 16px;
		box-shadow: 0 -2px 16px hsl(220deg 40% 30% / 0.15);

		padding: 1.25rem;
		padding-bottom: calc(1.25rem + env(safe-area-inset-bottom, 0px));

		display: flex;
		flex-direction: column;
		gap: 0.75rem;

		width: 100%;
		max-width: 50em;

		&--header {
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		&--title {
			font-size: 1rem;
			font-weight: 700;
			margin: 0;
		}

		&--close {
			background: hsl(from var(--c--main--text) h s l / 0.08);
			border: none;
			color: var(--c--main--text);
			cursor: pointer;
			font-size: 1.25rem;
			line-height: 1;
			min-height: 2.75rem;
			min-width: 2.75rem;
			display: grid;
			place-items: center;
			border-radius: 10px;
			touch-action: manipulation;
			transition: background 0.15s;

			&:hover {
				background: hsl(from var(--c--main--text) h s l / 0.15);
			}

			&:active {
				scale: 0.92;
			}
		}

		&--info {
			font-size: 0.85rem;
			opacity: 0.7;
		}

		&--share-btn {
			background-color: var(--c--suggestion--background, #e06468);
			touch-action: manipulation;
			border: none;
			border-radius: 10px;
			color: #fff;
			cursor: pointer;
			font-family: inherit;
			font-size: 1rem;
			font-weight: 700;
			padding: 0.85rem 1.5rem;
			width: 100%;
			transition:
				filter 0.15s,
				scale 0.1s;

			&:hover:not(:disabled) {
				filter: brightness(1.1);
			}

			&:active:not(:disabled) {
				scale: 0.97;
			}

			&:disabled {
				opacity: 0.6;
				cursor: wait;
			}
		}
	}

	.time-adjust {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.25rem;

		&--btn {
			background: hsl(from var(--c--main--text) h s l / 0.08);
			border: none;
			border-radius: 8px;
			color: var(--c--main--text);
			cursor: pointer;
			font-size: 0.85rem;
			line-height: 1;
			min-height: 2.75rem;
			min-width: 2.75rem;
			display: grid;
			place-items: center;
			touch-action: manipulation;
			transition: background 0.15s;

			&:hover {
				background: hsl(from var(--c--main--text) h s l / 0.15);
			}

			&:active {
				scale: 0.9;
			}
		}

		&--value {
			font-size: 1.1rem;
			font-weight: 700;
			min-width: 3.5rem;
			text-align: center;
			font-variant-numeric: tabular-nums;
		}

		&--separator {
			margin-inline: 0.25rem;
			opacity: 0.5;
		}
	}
</style>
