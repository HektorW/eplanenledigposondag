import type { Page } from 'puppeteer-core';
import { selectors } from './constants';
import type { FieldScrapeConfig } from './fieldScrapeConfig';
import { filterElementsWithText } from './getElementWithText';
import { attempt, isFail } from '$lib/attempt';
import { assertNonNullish } from '$lib/assert';
import { withSelector } from './withElement';
import { createLogger } from '../logger';
import { waitForUnblocked } from './waitForUnblocked';

const logger = createLogger('scrapeBlazor:step2SearchForField');

export async function searchForField(page: Page, config: FieldScrapeConfig): Promise<void> {
	const maxAttempts = 3;

	for (let attemptIndex = 0; attemptIndex < maxAttempts; attemptIndex++) {
		logger.debug('Searching for field and selecting labels...', {
			searchTerm: config.searchTerm,
			attemptIndex
		});

		if (await trySearchAndClickLabels(page, config)) return;

		logger.debug('Retrying search for labels', { attemptIndex });
	}

	throw new Error(`Failed to search for and select field labels after ${maxAttempts} attempts`);
}

/** One attempt. False means something went stale mid-way and a retry is due. */
async function trySearchAndClickLabels(page: Page, config: FieldScrapeConfig): Promise<boolean> {
	await typeSearchTermAndSubmit(page, config.searchTerm);
	logger.debug('Search term entered');

	logger.debug('Looking for correct labels to appear...');

	const labelsReady = await attempt(() => waitForFieldLabels(page, config));
	if (isFail(labelsReady)) {
		logger.debug('Error while waiting for labels:', labelsReady.error);
		return false;
	}

	// Labels confirmed present. Clicking while the busy overlay is still up
	// silently does nothing, so wait it out first.
	await waitForUnblocked(page);
	const allLabels = await page.$$(selectors.resourceLabel);
	const fieldLabels = await filterElementsWithText(allLabels, config.labelText);

	logger.debug('Found field labels, clicking on them:', { count: fieldLabels.length });

	for (const label of fieldLabels) {
		const labelFor = await label.evaluate((el) => el.getAttribute('for'));
		if (!labelFor) {
			logger.debug('Label for attribute not found', { index: fieldLabels.indexOf(label) });
			fieldLabels.forEach((label) => label.dispose());
			return false;
		}

		const inputElement = await page.$(`[id="${labelFor}"]`);
		if (!inputElement) {
			logger.debug('Input element not found for label', { index: fieldLabels.indexOf(label) });
			fieldLabels.forEach((label) => label.dispose());
			return false;
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
				return false;
			}
		}
	}

	fieldLabels.forEach((label) => label.dispose());
	return true;
}

const LABEL_LIST_POLL_MS = 50;
const LABEL_LIST_STABLE_MS = 300;

/**
 * Waits until exactly `labelCount` of the listed resources belong to this
 * field *and* the list has stopped changing.
 *
 * The search runs live on input and the list can re-render more than once
 * as Blazor round-trips resolve (observed: a broad intermediate result set
 * replaced by the final one 30-100ms later). A label clicked from a list that
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

const TYPE_ATTEMPT_COUNT = 5;
/** Attempts from this index on type key by key instead of inserting at once. */
const KEYSTROKE_FALLBACK_FROM_ATTEMPT = 2;
const KEYSTROKE_DELAY_MS = 100;
const RETRY_BACKOFF_MS = 400;
/** The input must hold the term this long before Blazor is trusted to keep it. */
const VALUE_SETTLE_MS = 300;

/**
 * Puts the search term into the search input. The search runs live on input,
 * so no submit is needed (Enter would only queue a second search with the
 * server's not-yet-updated value).
 *
 * Every input event is a Blazor round-trip, and the server's response
 * re-renders the input with the value the server holds, so a term inserted
 * while the server is still busy with step 1's probe comes back as ''. On
 * Vercel's headless chromium, click + insert right after step 1 read back ''
 * on every attempt when the retries ran back to back, while the same code
 * passed locally (full Chrome, Blazor settled before we typed). Waiting for
 * the busy overlay, focusing explicitly and backing off between attempts
 * fixed it there on the first attempt; which of the three mattered was not
 * isolated, so keep all of them.
 *
 * Inserting the whole term at once is one event, one round-trip, nothing to
 * clobber, so it goes first. Key-by-key typing (what the scraper did before)
 * is the fallback: it drops characters when round-trips overlap, but it
 * worked in production. The value is read back after a settle period so a
 * late reset is caught here instead of as missing search results.
 */
async function typeSearchTermAndSubmit(page: Page, searchTerm: string) {
	for (let attemptIndex = 0; attemptIndex < TYPE_ATTEMPT_COUNT; attemptIndex++) {
		const useKeystrokes = attemptIndex >= KEYSTROKE_FALLBACK_FROM_ATTEMPT;

		await waitForUnblocked(page);
		if (attemptIndex > 0) {
			await sleep(RETRY_BACKOFF_MS * attemptIndex);
		}

		await withSelector(page, selectors.searchInput, async (searchInput) => {
			assertNonNullish(searchInput, 'Search input not found');

			const currentValue = await searchInput.evaluate((el) => (el as HTMLInputElement).value);
			logger.debug('Search input value before insert', {
				currentValue,
				attemptIndex,
				useKeystrokes
			});

			// Select-all + backspace so Blazor's binding sees real editing
			// events, unlike `.value = ''` which it ignores.
			await searchInput.click({ clickCount: 3 });
			await searchInput.focus();
			if (currentValue.length > 0) {
				await searchInput.press('Backspace');
			}

			if (useKeystrokes) {
				await searchInput.type(searchTerm, { delay: KEYSTROKE_DELAY_MS });
			} else {
				await page.keyboard.sendCharacter(searchTerm);
			}
		});

		await sleep(VALUE_SETTLE_MS);
		const actualValue = await page.$eval(
			selectors.searchInput,
			(el) => (el as HTMLInputElement).value
		);
		logger.debug('Search input value after insert', {
			expected: searchTerm,
			actual: actualValue,
			attemptIndex,
			useKeystrokes
		});

		if (actualValue === searchTerm) return;

		logger.debug('Search input did not take the term, retrying', {
			attemptIndex,
			expected: searchTerm,
			actual: actualValue
		});
	}

	throw new Error(`Failed to enter search term after ${TYPE_ATTEMPT_COUNT} attempts`);
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
