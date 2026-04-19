<script lang="ts">
	import { browser } from '$app/environment';
	import { applyTheme, isTheme, resolveEffectiveTheme, type Theme } from '$lib/theme';

	function readInitialTheme(): Theme {
		const attr = document.documentElement.dataset.theme;
		return isTheme(attr) ? attr : 'system';
	}

	let theme = $state<Theme>(browser ? readInitialTheme() : 'system');
	let systemPrefersDark = $state(
		browser ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
	);

	$effect(() => {
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const onChange = (event: MediaQueryListEvent) => {
			systemPrefersDark = event.matches;
		};
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	const effective: 'light' | 'dark' = $derived(resolveEffectiveTheme(theme, systemPrefersDark));
	const overridden = $derived(theme !== 'system');

	function toggle() {
		const next: Theme = overridden ? 'system' : effective === 'dark' ? 'light' : 'dark';
		theme = next;
		applyTheme(next);
	}
</script>

{#if browser}
	<button
		type="button"
		class="theme-toggle"
		class:overridden
		aria-label="Färgtema"
		aria-pressed={overridden}
		onclick={toggle}
	>
		{#if effective === 'dark'}
			<svg
				data-icon="moon"
				viewBox="0 0 24 24"
				width="18"
				height="18"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
			</svg>
		{:else}
			<svg
				data-icon="sun"
				viewBox="0 0 24 24"
				width="18"
				height="18"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				aria-hidden="true"
			>
				<circle cx="12" cy="12" r="4" />
				<path
					d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
				/>
			</svg>
		{/if}
	</button>
{/if}

<style lang="scss">
	.theme-toggle {
		align-items: center;
		background: transparent;
		border: 1px solid var(--c--grid--line);
		border-radius: 999px;
		color: inherit;
		cursor: pointer;
		display: inline-flex;
		font: inherit;
		height: 2.25rem;
		justify-content: center;
		opacity: 0.7;
		padding: 0;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease,
			opacity 0.15s ease;
		width: 2.25rem;

		&:hover {
			opacity: 1;
		}

		&.overridden {
			background-color: var(--c--surface--raised);
			border-color: transparent;
			opacity: 1;
		}
	}
</style>
