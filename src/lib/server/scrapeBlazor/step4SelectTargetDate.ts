import { assertNonNullish } from '$lib/assert';
import type { Page } from 'puppeteer-core';
import { resourceAndDateRegex } from './constants';
import { withSelector } from './withElement';
import { createLogger } from '../logger';

const logger = createLogger('scrapeBlazor:step4SelectTargetDate');

export async function selectTargetDate(page: Page, targetDate: Date, retryCount = 0) {
	if (retryCount > 10) {
		throw new Error('Max retries reached while selecting target date');
	}

	const month = targetDate.getMonth() + 1;
	const day = targetDate.getDate();
	const dayAbbreviation = targetDate.toLocaleDateString('en-US', { weekday: 'short' });

	const prefix = (n: number) => (n < 10 ? '0' + n : n);
	const targetDateStr = `${dayAbbreviation} ${prefix(day)}/${prefix(month)}`;

	const elementText = await withSelector(page, '.k-link.k-nav-day', async (element) => {
		assertNonNullish(element, 'Date element not found');
		const elementText = await element.evaluate((el) => el.textContent?.trim());
		assertNonNullish(elementText, 'Element text not found');
		return elementText;
	});

	if (!elementText.includes(targetDateStr)) {
		logger.debug('Target day not found, selecting next day', {
			elementText
		});

		await selectNextDay(page);

		// Wait for the date text to change inside the browser — no CDP round trips per poll
		try {
			await page.waitForFunction(
				(oldText: string) => {
					const el = document.querySelector('.k-link.k-nav-day');
					return el?.textContent?.trim() !== oldText;
				},
				{ timeout: 500 },
				elementText
			);
		} catch {
			logger.debug('Failed to find new text after clicking next button');
		}

		return selectTargetDate(page, targetDate, retryCount + 1);
	}

	logger.debug('Found target day:', elementText);
	await waitForTargetDateBookingsAreVisible(page, targetDate);
}

async function selectNextDay(page: Page) {
	await withSelector(page, '.k-toolbar button[aria-label="Next"]', async (nextBtn) => {
		assertNonNullish(nextBtn, 'Next button not found');
		await nextBtn.click();
	});
}

async function waitForTargetDateBookingsAreVisible(page: Page, targetDate: Date) {
	logger.debug('Waiting for target date bookings to be visible...');

	const targetMonth = targetDate.getMonth() + 1;
	const targetDay = targetDate.getDate();

	// First check if any events appear within 1500ms.
	// If none appear, assume it's an empty day and move on.
	// Note: the scraper arrives here faster now that CDP polling overhead is gone,
	// so Blazor needs more wall-clock time to finish rendering events.
	let hasEvents = false;
	try {
		await page.waitForFunction(
			() => document.querySelectorAll('.k-scheduler-body .k-event').length > 0,
			{ timeout: 1500 }
		);
		hasEvents = true;
	} catch {
		// No events appeared — likely an empty day
	}

	if (hasEvents) {
		// Events exist — wait for them to match the target date
		await page.waitForFunction(
			(month: number, day: number, regexSource: string) => {
				const events = document.querySelectorAll('.k-scheduler-body .k-event');
				const first = events[0];
				if (!first) return false;
				const ariaLabel = first.getAttribute('aria-label');
				if (!ariaLabel) return false;
				const match = ariaLabel.match(new RegExp(regexSource));
				if (!match) return false;
				const startDate = match[2];
				const [m, d] = startDate.split('/').map(Number);
				return m === month && d === day;
			},
			{ timeout: 2000 },
			targetMonth,
			targetDay,
			resourceAndDateRegex.source
		);
	}

	logger.debug('Target date bookings are visible');
}
