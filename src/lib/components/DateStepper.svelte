<script lang="ts">
	import { resolve } from '$app/paths';
	import { Temporal } from '@js-temporal/polyfill';
	import { MAX_FUTURE_DAYS, dateToPlainDate } from '$lib/utils';

	type DateStepperProps = {
		date: Date;
	};

	const { date }: DateStepperProps = $props();

	const plainDate = $derived(dateToPlainDate(date));
	const today = $derived(Temporal.Now.plainDateISO());
	const maxDate = $derived(today.add({ days: MAX_FUTURE_DAYS }));

	const prevDate = $derived(plainDate.subtract({ days: 1 }));
	const nextDate = $derived(plainDate.add({ days: 1 }));

	const canGoPrev = $derived(Temporal.PlainDate.compare(prevDate, today) >= 0);
	const canGoNext = $derived(Temporal.PlainDate.compare(nextDate, maxDate) <= 0);

	const formatted = $derived(
		date.toLocaleDateString('sv-SE', {
			day: 'numeric',
			month: 'long'
		})
	);
</script>

<span class="stepper" data-sveltekit-preload-data="hover">
	{#if canGoPrev}
		<a
			class="step"
			href={resolve(`/?date=${prevDate.toString()}`)}
			rel="prev"
			aria-label="Föregående dag">‹</a
		>
	{:else}
		<span class="step step--disabled" aria-hidden="true">‹</span>
	{/if}

	<time datetime={plainDate.toString()}>{formatted}</time>

	{#if canGoNext}
		<a
			class="step"
			href={resolve(`/?date=${nextDate.toString()}`)}
			rel="next"
			aria-label="Nästa dag">›</a
		>
	{:else}
		<span class="step step--disabled" aria-hidden="true">›</span>
	{/if}
</span>

<style>
	.stepper {
		align-items: baseline;
		display: inline-flex;
		gap: 0.3em;
	}

	.step {
		color: inherit;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		position: relative;
		min-width: 1.2em;
		padding: 0 0.15em;
		font-size: 1.15em;
		line-height: 1;
		text-decoration: none;
		opacity: 0.35;
		border-radius: 0.25em;
		transition: opacity 0.15s ease;
	}

	/* Extend tap target without enlarging the visual element */
	a.step::before {
		content: '';
		position: absolute;
		inset: -0.85em -0.65em;
	}

	a.step:hover,
	a.step:focus-visible {
		opacity: 1;
	}

	a.step:active {
		opacity: 1;
		background-color: var(--c--surface--raised);
		transform: scale(0.94);
	}

	.step--disabled {
		opacity: 0.12;
	}
</style>
