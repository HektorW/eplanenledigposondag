<script lang="ts">
	import type { Snippet } from 'svelte';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';

	let { children }: { children: Snippet } = $props();
</script>

<div class="theme-toggle-slot">
	<ThemeSwitcher />
</div>

{@render children()}

<style lang="scss">
	@mixin dark-theme {
		--c--main--background: var(--c--blue--20);
		--c--main--text: var(--c--blue--96);

		--c--focus--outline: var(--c--blue--96);
		--c--surface--raised: var(--c--blue--28);

		--c--booking--background: var(--c--blue--35);
		--c--booking--text: var(--c--white--100);
	}

	:root {
		//
		// Colors base
		//
		--c--blue--20: hsl(207, 65%, 20%);
		--c--blue--35: hsl(207, 45%, 35%);
		--c--blue--96: hsl(207, 100%, 96%);

		--c--blue--28: hsl(207, 55%, 28%);
		--c--blue--92: hsl(207, 80%, 92%);

		--c--red--52: hsl(358, 48%, 52%);
		--c--red--64: hsl(358, 65%, 64%);

		--c--white--100: hsl(0, 0%, 100%);

		//
		// Colors semantic
		//
		--c--main--background: var(--c--blue--96);
		--c--main--text: var(--c--blue--20);

		--c--booking--background: var(--c--blue--35);
		--c--booking--text: var(--c--white--100);

		--c--suggestion--background: var(--c--red--64);
		--c--suggestion--border: var(--c--red--52);
		--c--suggestion--text: var(--c--white--100);

		--c--surface--raised: var(--c--blue--92);

		--c--focus--outline: var(--c--blue--20);

		--c--grid--line: hsl(from var(--c--main--text) h s l / 15%);

		//
		// Shadows
		//
		--box-shadow--booking: 0.5px 1px 1px hsl(220deg 60% 50% / 0.7);

		//
		// Other
		//
		--border-radius--100: 10px;

		--grid-columns: 4em 1fr 1fr;

		@media screen and (max-width: 355px) {
			font-size: 14px;
		}

		@media screen and (min-width: 700px) {
			font-size: 20px;
		}
	}

	:root[data-theme='dark'] {
		@include dark-theme;
	}

	@media (prefers-color-scheme: dark) {
		:root:not([data-theme='light']):not([data-theme='dark']) {
			@include dark-theme;
		}
	}

	:global(*, *::after, *::before) {
		box-sizing: border-box;
	}

	@layer base {
		:global(:focus-visible) {
			outline: 3px solid var(--c--focus--outline);
			outline-offset: 3px;

			@media (prefers-reduced-motion: no-preference) {
				animation: focus-expand 0.15s ease-out;
			}
		}

		@keyframes focus-expand {
			from {
				outline-offset: 5px;
			}
			to {
				outline-offset: 3px;
			}
		}
	}

	:global(body) {
		background-color: var(--c--main--background);
		color: var(--c--main--text);

		font-family: 'Montserrat', sans-serif;
		font-optical-sizing: auto;
		font-weight: 400;
		font-style: normal;

		margin: 0;
	}

	:global(:root.theme-switching::view-transition-old(root)),
	:global(:root.theme-switching::view-transition-new(root)) {
		animation-duration: 180ms;
	}

	.theme-toggle-slot {
		position: fixed;
		top: max(0.75rem, env(safe-area-inset-top));
		right: max(0.75rem, env(safe-area-inset-right));
		z-index: 10;
	}
</style>
