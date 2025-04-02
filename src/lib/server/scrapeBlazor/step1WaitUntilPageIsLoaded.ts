import type { Page } from 'puppeteer-core';
import { waitFor } from './waitFor';
import { withSelector } from './withElement';
import { createLogger } from '../logger2';

const logger = createLogger('scrapeBlazor:step1WaitUntilPageIsLoaded');

export async function waitUntilPageIsLoaded(page: Page) {
	await waitForSearchInputToBeCleared(page);
}

// Blazor will clear the input when hydrating the DOM
async function waitForSearchInputToBeCleared(page: Page) {
	logger.info('Waiting for search input to be cleared...');

	await withSelector(page, 'input[type="text"]', async (firstSearchInput) => {
		logger.debug('Typing into search input...');
		await firstSearchInput?.type('waiting');

		const value = await firstSearchInput?.evaluate((el) => (el as HTMLInputElement).value);
		logger.debug('Typed into search input, it has value', { value });

		await waitFor(async () => {
			const freshSearchInput = await page.waitForSelector('input[type="text"]');
			const inputValue = await freshSearchInput?.evaluate((el) => (el as HTMLInputElement).value);

			logger.debug('Fresh search input has value', { inputValue });

			return inputValue === 'waiting' ? null : true;
		});
	});

	logger.info('Search input cleared');
}
