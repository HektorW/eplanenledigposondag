import type { Page } from 'puppeteer-core';
import { assertNonNullish } from '$lib/assert';
import { waitForElementWithText } from './waitFor';
import { createLogger } from '../logger2';

const logger = createLogger('scrapeBlazor:step3SelectDayView');

export async function selectDayView(page: Page) {
	logger.debug('Selecting day view...');
	const dayBtn = await waitForElementWithText(page, '.k-toolbar .k-button-group button', 'Day');
	assertNonNullish(dayBtn, 'Day button not found');
	await dayBtn.click();
	dayBtn.dispose();
	logger.debug('Day button clicked');

	await waitUntilDayViewIsVisible(page);
	logger.debug('Day view is visible');
}

async function waitUntilDayViewIsVisible(page: Page) {
	await page.waitForFunction(
		() => {
			const row = document.querySelector('.k-scheduler-body .k-scheduler-row');
			if (!row) return false;
			const cells = row.querySelectorAll('.k-slot-cell');
			return cells.length === 3;
		},
		{ timeout: 2000 }
	);
}
