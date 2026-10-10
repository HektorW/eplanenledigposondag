<script lang="ts">
	import { resolve } from '$app/paths';

	export type FieldChip = {
		id: string;
		name: string;
		/** Page query string, e.g. `?date=2026-10-11&field=x` */
		query: `?${string}`;
	};

	type FieldChipsProps = {
		chips: FieldChip[];
		selectedId: string;
	};

	const { chips, selectedId }: FieldChipsProps = $props();
</script>

<nav class="field-chips" aria-label="Planer" data-sveltekit-preload-data="tap">
	{#each chips as chip (chip.id)}
		<a
			class="field-chip"
			href={resolve(`/${chip.query}`)}
			aria-current={chip.id === selectedId ? 'page' : undefined}
			data-testid="field-chip-{chip.id}"
		>
			{chip.name}
		</a>
	{/each}
</nav>

<style>
	.field-chips {
		display: flex;
		gap: 0.5rem;
		margin-block: -1rem 1.5rem;
		overflow-x: auto;
		scrollbar-width: none;
		/* Let chips scroll edge to edge on narrow screens */
		margin-inline: -1rem;
		padding-inline: 1rem;
	}

	.field-chip {
		border: 1px solid var(--c--grid--line);
		border-radius: 999px;
		color: inherit;
		flex-shrink: 0;
		font-size: 0.875rem;
		padding: 0.3em 0.8em;
		text-decoration: none;
		white-space: nowrap;

		&:hover {
			background: hsl(from var(--c--main--text) h s l / 0.04);
		}

		&[aria-current='page'] {
			background: var(--c--surface--raised);
			border-color: transparent;
			font-weight: 700;
		}
	}
</style>
