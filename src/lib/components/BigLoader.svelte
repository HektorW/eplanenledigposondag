<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { type TransitionConfig } from 'svelte/transition';
	import BouncyLoader from './BouncyLoader.svelte';

	type BigLoaderProps = {
		messages?: (string | { text: string; imageUrl: string })[];
		delayMs?: number;
	};

	const { messages, delayMs = 3000 }: BigLoaderProps = $props();

	let activeMessageIndex = $state(0);
	let activeMessage = $derived(messages?.[activeMessageIndex]);

	$effect(() => {
		if (messages?.length) {
			activeMessageIndex = 0;
		}

		const interval = setInterval(() => {
			activeMessageIndex = (activeMessageIndex + 1) % (messages?.length ?? 0);
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

	{#if activeMessage}
		{#key activeMessage}
			<p in:fadeSlide={{ direction: 1, delay: 300 }} out:fadeSlide={{ direction: -1 }}>
				{#if typeof activeMessage === 'string'}
					{activeMessage}
				{:else}
					{activeMessage.text} <img src={activeMessage.imageUrl} alt="" />
				{/if}
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

		img {
			height: 1em;
			width: 1em;
		}
	}
</style>
