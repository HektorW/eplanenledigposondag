<script lang="ts">
	import { MAX_FUTURE_DAYS, formatIsoDate } from '$lib/utils';

	type DateStepperProps = {
		date: Date;
	};

	const { date }: DateStepperProps = $props();

	const today = $derived.by(() => {
		const now = new Date();
		return new Date(now.getFullYear(), now.getMonth(), now.getDate());
	});

	const maxDate = $derived.by(() => {
		const d = new Date(today);
		d.setDate(d.getDate() + MAX_FUTURE_DAYS);
		return d;
	});

	const prevDate = $derived.by(() => {
		const d = new Date(date);
		d.setDate(d.getDate() - 1);
		return d;
	});

	const nextDate = $derived.by(() => {
		const d = new Date(date);
		d.setDate(d.getDate() + 1);
		return d;
	});

	const canGoPrev = $derived(prevDate >= today);
	const canGoNext = $derived(nextDate <= maxDate);

	const prevHref = $derived(`?date=${formatIsoDate(prevDate)}`);
	const nextHref = $derived(`?date=${formatIsoDate(nextDate)}`);

	const formatted = $derived(
		date.toLocaleDateString('sv-SE', {
			day: 'numeric',
			month: 'long'
		})
	);
</script>

<span class="stepper">
	{#if canGoPrev}
		<a class="step" href={prevHref} rel="prev" aria-label="Föregående dag">‹</a>
	{:else}
		<span class="step step--disabled" aria-hidden="true">‹</span>
	{/if}

	<time datetime={date.toDateString()}>{formatted}</time>

	{#if canGoNext}
		<a class="step" href={nextHref} rel="next" aria-label="Nästa dag">›</a>
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
		min-width: 1.2em;
		padding: 0 0.15em;
		font-size: 1.15em;
		line-height: 1;
		text-decoration: none;
		opacity: 0.35;
		border-radius: 0.25em;
		transition: opacity 0.15s ease;
	}

	a.step:hover,
	a.step:focus-visible {
		opacity: 1;
	}

	.step--disabled {
		opacity: 0.12;
	}
</style>
