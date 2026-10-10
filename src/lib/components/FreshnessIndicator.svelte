<script lang="ts">
	import { formatScrapedAt } from '$lib/utils';
	import StatusDot from './StatusDot.svelte';

	type FreshnessIndicatorProps = {
		scrapedAt: string;
		refreshing: boolean;
	};

	const { scrapedAt, refreshing }: FreshnessIndicatorProps = $props();

	const formattedTime = $derived(formatScrapedAt(scrapedAt));

	const absoluteTime = $derived(
		new Date(scrapedAt).toLocaleString('sv-SE', {
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
		<StatusDot status={refreshing ? 'refreshing' : 'fresh'} />
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
