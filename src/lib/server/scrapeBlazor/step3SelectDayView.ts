import type { Page } from 'puppeteer-core';
import { assertNonNullish } from '$lib/assert';
import { waitForElementWithText } from './waitFor';
import { createLogger } from '../logger';
import { waitForUnblocked } from './waitForUnblocked';

const logger = createLogger('scrapeBlazor:step3SelectDayView');

export async function selectDayView(page: Page, columnCount: number) {
	logger.debug('Selecting day view...');
	const dayBtn = await waitForElementWithText(page, '.k-toolbar .k-button-group button', 'Day');
	assertNonNullish(dayBtn, 'Day button not found');
	await waitForUnblocked(page);
	await dayBtn.click();
	dayBtn.dispose();
	logger.debug('Day button clicked');

	await waitUntilDayViewIsVisible(page, columnCount);
	logger.debug('Day view is visible');
}

async function waitUntilDayViewIsVisible(page: Page, columnCount: number) {
	await page.waitForFunction(
		(expectedCount: number) => {
			const row = document.querySelector('.k-scheduler-body .k-scheduler-row');
			if (!row) return false;
			const cells = row.querySelectorAll('.k-slot-cell');
			return cells.length === expectedCount;
		},
		{ timeout: 2000 },
		columnCount
	);
}
