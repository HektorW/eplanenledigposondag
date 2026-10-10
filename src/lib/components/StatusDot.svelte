<script lang="ts">
	import type { FieldStatus } from '$lib/types';

	type StatusDotProps = {
		status: FieldStatus;
	};

	const { status }: StatusDotProps = $props();
</script>

<span class="status-dot status-dot--{status}" data-status={status} aria-hidden="true"></span>

<style>
	.status-dot {
		width: 0.5em;
		height: 0.5em;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.status-dot--fresh {
		background-color: #4ade80;
		box-shadow: 0 0 4px #4ade8080;
	}

	.status-dot--stale,
	.status-dot--refreshing {
		background-color: #facc15;
		box-shadow: 0 0 4px #facc1580;
	}

	.status-dot--refreshing {
		animation: dot-pulse 1.5s ease-in-out infinite;
	}

	.status-dot--none {
		background-color: hsl(from var(--c--main--text) h s l / 0.3);
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
</style>
