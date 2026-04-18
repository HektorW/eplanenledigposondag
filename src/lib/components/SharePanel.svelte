<script lang="ts">
	import {
		CALENDAR_END_MINUTES,
		CALENDAR_START_MINUTES,
		hasConflict,
		MIN_SUGGESTION_DURATION_MINUTES
	} from '$lib/calendar';
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

	function tryAdjust(next: TimeSuggestion) {
		if (next.startMinutes < CALENDAR_START_MINUTES) return;
		if (next.startMinutes + next.durationMinutes > CALENDAR_END_MINUTES) return;
		if (next.durationMinutes < MIN_SUGGESTION_DURATION_MINUTES) return;
		if (hasConflict(bookings, next.court, next.startMinutes, next.durationMinutes)) return;
		onadjust(next);
	}

	function adjustStart(delta: number) {
		tryAdjust({ ...suggestion, startMinutes: suggestion.startMinutes + delta });
	}

	function adjustDuration(delta: number) {
		tryAdjust({ ...suggestion, durationMinutes: suggestion.durationMinutes + delta });
	}

	function onKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') onclose();
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
			duration: 350,
			easing: cubicOut,
			css: (t: number) => {
				const y = (1 - t) * 100;
				const scale = 0.97 + t * 0.03;
				const blur = (1 - t) * 4;
				return `transform: translateY(${y}%) scale(${scale}); opacity: ${t}; filter: blur(${blur}px)`;
			}
		};
	}

	function panelOut(_node: Element) {
		return {
			duration: 300,
			easing: (t: number) => t,
			css: (t: number) => {
				const y = (1 - t) * 8;
				const scale = 0.98 + t * 0.02;
				const blur = Math.pow(1 - t, 0.7) * 8;
				const opacity = t * t;
				return `transform: translateY(${y}px) scale(${scale}); opacity: ${opacity}; filter: blur(${blur}px)`;
			}
		};
	}
</script>

<svelte:window onkeydown={onKeyDown} />

<dialog class="share-panel" open in:panelIn out:panelOut>
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
			<button class="time-adjust--btn" onclick={() => adjustStart(15)} aria-label="Senare starttid">
				▶
			</button>

			<span class="time-adjust--separator">–</span>

			<button class="time-adjust--btn" onclick={() => adjustDuration(-15)} aria-label="Kortare tid">
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
</dialog>

<style lang="scss">
	.share-panel {
		position: fixed;
		left: 50%;
		bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));
		translate: -50% 0;
		z-index: 10;

		border: none;
		color: inherit;
		background: var(--c--surface--raised);
		border-radius: 16px;
		box-shadow:
			0 4px 24px hsl(220deg 40% 20% / 0.2),
			0 0 0 1px hsl(220deg 40% 50% / 0.08);

		padding: 1.25rem;

		display: flex;
		flex-direction: column;
		gap: 0.75rem;

		width: calc(100% - 1.5rem);
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
