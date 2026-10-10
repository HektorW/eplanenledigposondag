import type { Page } from 'puppeteer-core';
import { selectors } from './constants';
import type { FieldScrapeConfig } from './fieldScrapeConfig';
import { filterElementsWithText } from './getElementWithText';
import { attempt, isFail } from '$lib/attempt';
import { assertNonNullish } from '$lib/assert';
import { withSelector } from './withElement';
import { createLogger } from '../logger';

const logger = createLogger('scrapeBlazor:step2SearchForField');

export async function searchForField(page: Page, config: FieldScrapeConfig): Promise<void> {
	return searchAndClickLabels(page, config);
}

async function searchAndClickLabels(
	page: Page,
	config: FieldScrapeConfig,
	retryCount = 0
): Promise<void> {
	logger.debug('Searching for field and selecting labels...', {
		searchTerm: config.searchTerm,
		retryCount
	});

	function restartSearch() {
		logger.debug('Trying restart search for labels', { retryCount });

		const maxRetries = 2;
		if (retryCount >= maxRetries) {
			throw new Error('Max attempts reached for clicking searching and clicking labels');
		}

		return searchAndClickLabels(page, config, retryCount + 1);
	}

	await typeSearchTermAndSubmit(page, config.searchTerm);
	logger.debug('Search submitted with correct value');

	logger.debug('Looking for correct labels to appear...');

	const labelsReady = await attempt(() => waitForFieldLabels(page, config));
	if (isFail(labelsReady)) {
		logger.debug('Error while waiting for labels:', labelsReady.error);
		return restartSearch();
	}

	// Labels confirmed present — query them once for clicking
	const allLabels = await page.$$(selectors.resourceLabel);
	const fieldLabels = await filterElementsWithText(allLabels, config.labelText);

	logger.debug('Found field labels, clicking on them:', { count: fieldLabels.length });

	for (const label of fieldLabels) {
		const labelFor = await label.evaluate((el) => el.getAttribute('for'));
		if (!labelFor) {
			logger.debug('Label for attribute not found', { index: fieldLabels.indexOf(label) });
			fieldLabels.forEach((label) => label.dispose());
			return restartSearch();
		}

		const inputElement = await page.$(`[id="${labelFor}"]`);
		if (!inputElement) {
			logger.debug('Input element not found for label', { index: fieldLabels.indexOf(label) });
			fieldLabels.forEach((label) => label.dispose());
			return restartSearch();
		}

		const isChecked = await inputElement.evaluate((el) => (el as HTMLInputElement).checked);
		if (!isChecked) {
			const clickResult = await attempt(() => label.click());
			if (isFail(clickResult)) {
				logger.debug('Failed to click label', {
					index: fieldLabels.indexOf(label),
					error: clickResult.error
				});
				fieldLabels.forEach((label) => label.dispose());
				return restartSearch();
			}
		}
	}

	fieldLabels.forEach((label) => label.dispose());
}

const LABEL_LIST_POLL_MS = 50;
const LABEL_LIST_STABLE_MS = 300;

/**
 * Waits until exactly `labelCount` of the listed resources belong to this
 * field *and* the list has stopped changing.
 *
 * The search runs live on every keystroke, so after Enter the list can still
 * flip through results for partial terms as each Blazor round-trip resolves
 * (observed: several re-renders 30-100ms apart). A label clicked from a list that
 * is about to re-render is detached by the time the click lands, so require
 * the list to be unchanged for LABEL_LIST_STABLE_MS before clicking. The
 * search may also return other fields' resources; those are ignored as long
 * as the field's own labels are all present.
 */
async function waitForFieldLabels(page: Page, config: FieldScrapeConfig): Promise<void> {
	// Poll inside the browser instead of round-tripping through CDP on every
	// iteration. Stability state lives on `window` because the poll function is
	// re-evaluated from scratch each time.
	await page.evaluate(() => {
		delete window.__labelListSignature;
		delete window.__labelListStablePolls;
	});

	await page.waitForFunction(
		(labelSelector: string, expectedText: string, labelCount: number, stablePolls: number) => {
			const labels = Array.from(document.querySelectorAll(labelSelector));
			const signature = labels.map((el) => el.textContent).join('\n');

			if (signature === window.__labelListSignature) {
				window.__labelListStablePolls = (window.__labelListStablePolls ?? 0) + 1;
			} else {
				window.__labelListSignature = signature;
				window.__labelListStablePolls = 0;
			}
			if (window.__labelListStablePolls < stablePolls) return false;

			const matching = labels.filter((el) => el.textContent?.includes(expectedText));
			return matching.length === labelCount;
		},
		{ timeout: 3000, polling: LABEL_LIST_POLL_MS },
		selectors.resourceLabel,
		config.labelText,
		config.labelCount,
		LABEL_LIST_STABLE_MS / LABEL_LIST_POLL_MS
	);
}

declare global {
	interface Window {
		__labelListSignature?: string;
		__labelListStablePolls?: number;
	}
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
