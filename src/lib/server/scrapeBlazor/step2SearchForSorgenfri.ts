import type { Page } from 'puppeteer-core';
import { selectors, texts } from './selectorsAndTexts';
import { waitFor } from './waitFor';
import { getAllElementsWithText } from './getElementWithText';
import { attempt, isFail } from '$lib/attempt';
import { assertNonNullish } from '$lib/assert';

export async function searchForSorgenfri(page: Page) {
	await searchAndClickLabels(page);
}

export async function searchAndClickLabels(page: Page, retryCount = 0): Promise<void> {
	console.log('Searching for "sorgenfri" and selecting labels...', { retryCount });

	function restartSearch() {
		const maxRetries = 2;
		if (retryCount >= maxRetries) {
			throw new Error('Max attempts reached for clicking searching and clicking labels');
		}

		return searchAndClickLabels(page, retryCount + 1);
	}

	const searchInput = await page.waitForSelector(selectors.searchInput);

	assertNonNullish(searchInput, 'Search input not found');

	await searchInput.evaluate((el) => ((el as HTMLInputElement).value = ''));
	await searchInput.type('sorgenfri');
	await searchInput.press('Enter');

	const sorgenfriLabels = await attempt(() =>
		waitFor(
			async () => {
				const labels = await getAllElementsWithText(page, selectors.resourceLabel, texts.sorgenfri);
				return labels.length >= 3 ? labels : null;
			},
			{
				maxTime: 500,
				errorMessage: 'searchAndClickLabels: Timeout while waiting for labels'
			}
		)
	);
	if (isFail(sorgenfriLabels)) {
		console.log('Error while searching for labels:', sorgenfriLabels.error);
		return restartSearch();
	}

	console.log('Found sorgenfri labels, clicking on them:', { count: sorgenfriLabels.length });

	for (const label of sorgenfriLabels) {
		const labelFor = await label.evaluate((el) => el.getAttribute('for'));
		if (!labelFor) {
			console.log('Label for attribute not found', { index: sorgenfriLabels.indexOf(label) });
			return restartSearch();
		}

		const inputElement = await page.$(`[id="${labelFor}"]`);
		if (!inputElement) {
			console.log('Input element not found for label', { index: sorgenfriLabels.indexOf(label) });
			return restartSearch();
		}

		const isChecked = await inputElement.evaluate((el) => (el as HTMLInputElement).checked);
		if (!isChecked) {
			const clickResult = await attempt(() => label.click());
			if (isFail(clickResult)) {
				console.log('Failed to click label', {
					index: sorgenfriLabels.indexOf(label),
					error: clickResult.error
				});
				return restartSearch();
			}
		}
	}
}
