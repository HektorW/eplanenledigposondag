import type { Page } from 'puppeteer-core';
import { assertNonNullish } from '$lib/assert';
import { waitFor, waitForElementWithText } from './waitFor';
import { createLogger } from '../logger2';

const logger = createLogger('scrapeBlazor:step3SelectDayView');

export async function selectDayView(page: Page) {
	logger.debug('Selecting day view...');
	const dayBtn = await waitForElementWithText(page, '.k-toolbar .k-button-group button', 'Day');
	assertNonNullish(dayBtn, 'Day button not found');
	await dayBtn.click();
	logger.debug('Day button clicked');

	await waitUntilDayViewIsVisible(page);
	logger.debug('Day view is visible');
}

async function waitUntilDayViewIsVisible(page: Page) {
	await waitFor(
		async () => {
			const row = await page.$('.k-scheduler-body .k-scheduler-row');

			const cells = await row?.$$('.k-slot-cell');
			logger.debug('waitUntilDayViewIsVisible', {
				cells: cells?.length
			});
			return cells?.length === 3 ? true : null;
		},
		{
			errorMessage: 'waitUntilDayViewIsVisible: Timeout while waiting for day view to be visible'
		}
	);
}
