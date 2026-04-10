import type { Page } from 'puppeteer-core';
import { selectors, texts } from './constants';
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

	// Use page.waitForFunction to poll inside the browser instead of round-tripping
	// through CDP on every poll iteration. Increased timeout from 500ms to 2000ms
	// to avoid expensive retries that require re-typing the search.
	const labelsReady = await attempt(() =>
		page.waitForFunction(
			(labelSelector: string, expectedText: string, expectedCount: number) => {
				const labels = document.querySelectorAll(labelSelector);
				if (labels.length !== expectedCount) return false;
				const matching = Array.from(labels).filter((el) =>
					el.textContent?.includes(expectedText)
				);
				return matching.length === expectedCount;
			},
			{ timeout: 2000 },
			selectors.resourceLabel,
			texts.sorgenfriIp,
			3
		)
	);
	if (isFail(labelsReady)) {
		logger.debug('Error while waiting for labels:', labelsReady.error);
		return restartSearch();
	}

	// Labels confirmed present — query them once for clicking
	const allLabels = await page.$$(selectors.resourceLabel);
	const sorgenfriLabels = await filterElementsWithText(allLabels, texts.sorgenfriIp);

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
