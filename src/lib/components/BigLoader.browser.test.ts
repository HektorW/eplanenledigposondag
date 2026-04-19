import { render } from 'vitest-browser-svelte';
import { expect, test, describe } from 'vitest';
import BigLoader from './BigLoader.svelte';

describe('BigLoader', () => {
	test('shows "Laddar..." when no messages provided', async () => {
		const screen = render(BigLoader);

		await expect.element(screen.getByText('Laddar...')).toBeVisible();
	});

	test('shows the first message from the list', async () => {
		const screen = render(BigLoader, {
			messages: ['First message', 'Second message'],
			delayMs: 10_000 // long delay so we stay on first
		});

		await expect.element(screen.getByText('First message')).toBeVisible();
	});

	test('renders string messages as plain text', async () => {
		const screen = render(BigLoader, {
			messages: ['Hello world'],
			delayMs: 10_000
		});

		await expect.element(screen.getByText('Hello world')).toBeVisible();
	});

	test('renders object messages with text and image', async () => {
		const screen = render(BigLoader, {
			messages: [{ text: 'Weather info', imageUrl: '/weather-icons/rain.png' }],
			delayMs: 10_000
		});

		await expect.element(screen.getByText('Weather info')).toBeVisible();
		const img = screen.container.querySelector('img');
		expect(img).not.toBeNull();
		expect(img?.getAttribute('src')).toBe('/weather-icons/rain.png');
	});
});
