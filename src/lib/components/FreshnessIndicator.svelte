<script lang="ts">
	import { APP_TIME_ZONE, formatScrapedAt } from '$lib/utils';
	import { Temporal } from '@js-temporal/polyfill';

	type FreshnessIndicatorProps = {
		scrapedAt: string;
		refreshing: boolean;
	};

	const { scrapedAt, refreshing }: FreshnessIndicatorProps = $props();

	const formattedTime = $derived(formatScrapedAt(scrapedAt));

	const absoluteTime = $derived(
		Temporal.Instant.from(scrapedAt).toZonedDateTimeISO(APP_TIME_ZONE).toLocaleString('sv-SE', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		})
	);
</script>

<p class="freshness" role="status">
	<button class="freshness-trigger" {...{ interestfor: 'freshness-popover' }}>
		<span class="freshness-dot" class:refreshing></span>
		<span class="freshness-text">
			Hämtades {formattedTime}{#if refreshing}
				<span class="refreshing-label"> &middot; Uppdaterar...</span>{/if}
		</span>
	</button>
</p>
<!-- popover="hint" — cast needed until Svelte types include it -->
<div id="freshness-popover" popover={'hint' as 'auto'} class="freshness-popover">
	{absoluteTime}
</div>

<style>
	.freshness {
		margin-block: 0 1rem;
	}

	.freshness-trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		font: inherit;
		font-size: 0.75rem;
		color: inherit;
		opacity: 0.6;
		cursor: default;
		background: none;
		border: none;
		padding: 0;
	}

	.freshness-dot {
		width: 0.5em;
		height: 0.5em;
		border-radius: 50%;
		flex-shrink: 0;
		background-color: #4ade80;
		box-shadow: 0 0 4px #4ade8080;

		&.refreshing {
			background-color: #facc15;
			box-shadow: 0 0 4px #facc1580;
			animation: dot-pulse 1.5s ease-in-out infinite;
		}
	}

	.refreshing-label {
		margin-inline-start: 0.25em;
		font-size: 0.85em;
		animation: text-pulse 1.5s ease-in-out infinite;
	}

	.freshness-popover {
		margin: 0 0 0.35rem;
		inset: auto;
		position-area: top span-right;
		position-try-fallbacks: flip-block;
		background: var(--c--surface--raised);
		color: var(--c--main--text);
		border: 1px solid var(--c--grid--line);
		border-radius: 0.375rem;
		padding: 0.35rem 0.6rem;
		font-size: 0.7rem;
		white-space: nowrap;
		box-shadow: 0 2px 8px hsl(220deg 60% 50% / 0.15);
	}

	@keyframes dot-pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.4;
			transform: scale(0.75);
		}
	}

	@keyframes text-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}
</style>
