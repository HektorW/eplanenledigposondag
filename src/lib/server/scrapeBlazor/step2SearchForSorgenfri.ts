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

	// enough to only get sorgenfri hits
	// avoids additional searches which detaches found labels
	const searchTerm = 'sor man';

	await typeSearchTermAndSubmit(page, searchTerm);
	logger.debug('Search submitted with correct value');

	logger.debug('Looking for correct labels to appear...');

	// Use page.waitForFunction to poll inside the browser instead of round-tripping
	// through CDP on every poll iteration.
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

/**
 * Types a search term into the search input and verifies Blazor accepted it.
 * Blazor's SignalR can clobber keystrokes during typing — each keystroke triggers
 * a server round-trip and the response can overwrite the input with stale state.
 * This function retries the entire type-and-verify cycle until the value is correct.
 */
async function typeSearchTermAndSubmit(page: Page, searchTerm: string) {
	const maxTypeAttempts = 5;
	const baseDelay = 150;

	for (let typeAttempt = 0; typeAttempt < maxTypeAttempts; typeAttempt++) {
		const delay = baseDelay + typeAttempt * 75;

		await withSelector(page, selectors.searchInput, async (searchInput) => {
			assertNonNullish(searchInput, 'Search input not found');

			const currentValue = await searchInput.evaluate((el) => (el as HTMLInputElement).value);
			logger.debug('Search input value before typing', { currentValue, typeAttempt, delay });

			// Clear via select-all + backspace so Blazor's SignalR binding sees
			// real keyboard events, unlike .value = '' which it ignores
			if (currentValue.length > 0) {
				await searchInput.click({ clickCount: 3 });
				await searchInput.press('Backspace');
				logger.debug('Cleared search input');
			}

			await searchInput.type(searchTerm, { delay });
			logger.debug('Typed search term:', searchTerm);
		});

		// Read back the value to verify Blazor didn't clobber it
		const actualValue = await page.$eval(
			selectors.searchInput,
			(el) => (el as HTMLInputElement).value
		);
		logger.debug('Search input value after typing', { expected: searchTerm, actual: actualValue });

		if (actualValue === searchTerm) {
			// Value is correct — submit the search
			await withSelector(page, selectors.searchInput, async (searchInput) => {
				assertNonNullish(searchInput, 'Search input not found');
				await searchInput.press('Enter');
				logger.debug('Pressed Enter on search input');
			});
			return;
		}

		logger.debug('Blazor clobbered the search input, retrying type', {
			typeAttempt,
			expected: searchTerm,
			actual: actualValue
		});
	}

	throw new Error(
		`Failed to type search term after ${maxTypeAttempts} attempts — Blazor keeps overwriting the input`
	);
}
