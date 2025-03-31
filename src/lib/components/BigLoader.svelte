<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { type TransitionConfig } from 'svelte/transition';
	import BouncyLoader from './BouncyLoader.svelte';

	type BigLoaderProps = {
		texts?: string[];
		delayMs?: number;
	};

	const { texts, delayMs = 3000 }: BigLoaderProps = $props();

	let activeTextIndex = $state(0);
	let activeText = $derived(texts?.[activeTextIndex]);

	$effect(() => {
		if (texts?.length) {
			activeTextIndex = 0;
		}

		const interval = setInterval(() => {
			activeTextIndex = (activeTextIndex + 1) % (texts?.length ?? 0);
		}, delayMs);

		return () => {
			clearInterval(interval);
		};
	});

	type SlideParams = { delay?: number; direction: number };

	function fadeSlide(node: Element, { delay, direction }: SlideParams): TransitionConfig {
		return {
			delay,
			duration: 850,
			easing: cubicOut,
			css: (t: number, u: number) => {
				return `opacity: ${t}; transform: translateX(${u * 40 * direction}px);`;
			}
		};
	}
</script>

<section>
	<BouncyLoader />

	{#if activeText}
		{#key activeText}
			<p in:fadeSlide={{ direction: 1, delay: 300 }} out:fadeSlide={{ direction: -1 }}>
				{activeText}
			</p>
		{/key}
	{:else}
		<p>Laddar...</p>
	{/if}
</section>

<style>
	section {
		display: grid;
		margin-top: -25%;
		place-items: center;
		place-self: center;
	}

	p {
		grid-column: 1;
		grid-row: 2;
	}
</style>
