import type { Page } from 'puppeteer-core';
import { assertNonNullish } from '$lib/assert';
import { createLogger } from '../logger2';

const logger = createLogger('scrapeBlazor:step1WaitUntilPageIsLoaded');

export async function waitUntilPageIsLoaded(page: Page) {
	await waitForSearchInputToBeCleared(page);
}

// Blazor will clear the input when hydrating the DOM
async function waitForSearchInputToBeCleared(page: Page) {
	logger.info('Waiting for search input to be cleared...');

	const firstSearchInput = await page.waitForSelector('input[type="text"]');
	assertNonNullish(firstSearchInput, 'Search input not found');

	logger.debug('Typing into search input...');
	await firstSearchInput.type('waiting');

	const value = await firstSearchInput.evaluate((el) => (el as HTMLInputElement).value);
	logger.debug('Typed into search input, it has value', { value });
	firstSearchInput.dispose();

	await page.waitForFunction(
		() => {
			const input = document.querySelector('input[type="text"]') as HTMLInputElement | null;
			return input !== null && input.value !== 'waiting';
		},
		{ timeout: 5000 }
	);

	logger.info('Search input cleared');
}
