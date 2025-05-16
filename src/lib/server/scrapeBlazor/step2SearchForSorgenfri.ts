import type { Page } from 'puppeteer-core';
import { selectors, texts } from './constants';
import { waitFor } from './waitFor';
import { filterElementsWithText } from './getElementWithText';
import { attempt, isFail } from '$lib/attempt';
import { assertNonNullish } from '$lib/assert';
import { withSelector } from './withElement';
import { createLogger } from '../logger2';

const logger = createLogger('scrapeBlazor:step2SearchForSorgenfri');

export async function searchForSorgenfri(page: Page) {
	await searchAndClickLabels(page);
}

export async function searchAndClickLabels(page: Page, retryCount = 0): Promise<void> {
	logger.debug('Searching for "sorgenfri" and selecting labels...', { retryCount });

	function restartSearch() {
		logger.debug('Trying restart search for labels', { retryCount });

		const maxRetries = 2;
		if (retryCount >= maxRetries) {
			throw new Error('Max attempts reached for clicking searching and clicking labels');
		}

		return searchAndClickLabels(page, retryCount + 1);
	}

	await withSelector(page, selectors.searchInput, async (searchInput) => {
		logger.debug('Found search input');
		assertNonNullish(searchInput, 'Search input not found');

		const searchInputValue = await searchInput.evaluate((el) => (el as HTMLInputElement).value);
		logger.debug('Current search input value:', searchInputValue);

		await searchInput.evaluate((el) => ((el as HTMLInputElement).value = ''));
		logger.debug('Set search input value to empty string');

		// enough to only get sorgenfri hits, avoids detched
		// avoids additional searches which detaches found labels
		const searchTerm = 'sor man';
		await searchInput.type(searchTerm, { delay: 50 });
		logger.debug('Typed search term:', searchTerm);
		await searchInput.press('Enter');
		logger.debug('Pressed Enter on search input');
	});

	logger.debug('Looking for correct labels to appear...');
	const sorgenfriLabels = await attempt(() =>
		waitFor(
			async () => {
				const expectedTotalLabels = 3;
				const expectedSorgenfriIpLabels = 3;

				const allLabels = await page.$$(selectors.resourceLabel);
				if (allLabels.length !== expectedTotalLabels) {
					logger.debug('Found labels with wrong count:', { count: allLabels.length });
					allLabels.forEach((label) => label.dispose());
					return null;
				}

				const sorgenfriIpLabels = await filterElementsWithText(allLabels, texts.sorgenfriIp);
				if (sorgenfriIpLabels.length !== expectedSorgenfriIpLabels) {
					logger.debug('Found labels with wrong sorgenfri IP count:', { sorgenfriIpLabels });
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
		logger.debug('Error while searching for labels:', sorgenfriLabels.error);
		return restartSearch();
	}

	logger.debug('Found sorgenfri labels, clicking on them:', { count: sorgenfriLabels.length });

	for (const label of sorgenfriLabels) {
		const labelFor = await label.evaluate((el) => el.getAttribute('for'));
		if (!labelFor) {
			logger.debug('Label for attribute not found', { index: sorgenfriLabels.indexOf(label) });
			sorgenfriLabels.forEach((label) => label.dispose());
			return restartSearch();
		}

		const inputElement = await page.$(`[id="${labelFor}"]`);
		if (!inputElement) {
			logger.debug('Input element not found for label', { index: sorgenfriLabels.indexOf(label) });
			sorgenfriLabels.forEach((label) => label.dispose());
			return restartSearch();
		}

		const isChecked = await inputElement.evaluate((el) => (el as HTMLInputElement).checked);
		if (!isChecked) {
			const clickResult = await attempt(() => label.click());
			if (isFail(clickResult)) {
				logger.debug('Failed to click label', {
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
