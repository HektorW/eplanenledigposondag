import type { Page } from 'puppeteer-core';
import { waitFor } from './waitFor';
import { withSelector } from './withElement';

export async function waitUntilPageIsLoaded(page: Page) {
	await waitForSearchInputToBeCleared(page);
}

// Blazor will clear the input when hydrating the DOM
async function waitForSearchInputToBeCleared(page: Page) {
	console.log('Waiting for search input to be cleared...');
	await withSelector(page, 'input[type="text"]', async (firstSearchInput) => {
		await firstSearchInput?.type('waiting');

		await waitFor(async () => {
			const freshSearchInput = await page.waitForSelector('input[type="text"]');
			const inputValue = await freshSearchInput?.evaluate((el) => (el as HTMLInputElement).value);
			return inputValue === 'waiting' ? null : true;
		});
	});
}
