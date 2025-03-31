import type { Page } from 'puppeteer-core';
import { selectors, texts } from './constants';
import { waitFor } from './waitFor';
import { filterElementsWithText, getAllElementsWithText } from './getElementWithText';
import { attempt, isFail } from '$lib/attempt';
import { assertNonNullish } from '$lib/assert';
import { withSelector } from './withElement';

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

	await withSelector(page, selectors.searchInput, async (searchInput) => {
		assertNonNullish(searchInput, 'Search input not found');

		await searchInput.evaluate((el) => ((el as HTMLInputElement).value = ''));

		// enough to only get sorgenfri hits, avoids detched
		// avoids additional searches which detaches found labels
		const searchTerm = 'sor ma';
		await searchInput.type(searchTerm);
		await searchInput.press('Enter');
	});

	const sorgenfriLabels = await attempt(() =>
		waitFor(
			async () => {
				const expectedTotalLabels = 3;
				const expectedSorgenfriIpLabels = 3;

				const allLabels = await page.$$(selectors.resourceLabel);
				if (allLabels.length !== expectedTotalLabels) {
					allLabels.forEach((label) => label.dispose());
					return null;
				}

				const sorgenfriIpLabels = await filterElementsWithText(allLabels, texts.sorgenfriIp);
				if (sorgenfriIpLabels.length !== expectedSorgenfriIpLabels) {
					allLabels.forEach((label) => label.dispose());
					return null;
				}

				return sorgenfriIpLabels;
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
			sorgenfriLabels.forEach((label) => label.dispose());
			return restartSearch();
		}

		const inputElement = await page.$(`[id="${labelFor}"]`);
		if (!inputElement) {
			console.log('Input element not found for label', { index: sorgenfriLabels.indexOf(label) });
			sorgenfriLabels.forEach((label) => label.dispose());
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
				sorgenfriLabels.forEach((label) => label.dispose());
				return restartSearch();
			}
		}
	}

	sorgenfriLabels.forEach((label) => label.dispose());
}
