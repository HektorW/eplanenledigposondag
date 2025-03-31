import { assertNonNullish } from '$lib/assert';
import type { Page } from 'puppeteer-core';
import { waitFor } from './waitFor';
import { resourceAndDateRegex } from './constants';
import { with$$, withSelector } from './withElement';
import { attempt, isFail } from '$lib/attempt';

export async function selectTargetDate(page: Page, targetDate: Date, retryCount = 0) {
	if (retryCount > 10) {
		throw new Error('Max retries reached while selecting target date');
	}

	const month = targetDate.getMonth() + 1;
	const day = targetDate.getDate();

	const prefix = (n: number) => (n < 10 ? '0' + n : n);
	const targetDateStr = `Sun ${prefix(day)}/${prefix(month)}`;

	const elementText = await withSelector(page, '.k-link.k-nav-day', async (element) => {
		assertNonNullish(element, 'Date element not found');
		const elementText = await element.evaluate((el) => el.textContent?.trim());
		assertNonNullish(elementText, 'Element text not found');
		return elementText;
	});

	if (!elementText.includes(targetDateStr)) {
		console.log('Target day not found, selecting next day...', {
			targetDateStr,
			elementText
		});

		await selectNextDay(page);

		const waitingForNewTextResult = await attempt(() =>
			waitFor(
				async () => {
					return withSelector(page, '.k-link.k-nav-day', async (newElement) => {
						const newText = await newElement?.evaluate((el) => el.textContent?.trim());
						return newText !== elementText;
					});
				},
				{ maxTime: 500, pollInterval: 50 }
			)
		);
		if (isFail(waitingForNewTextResult)) {
			console.log('Failed to find new text after clicking next button');
		}

		return selectTargetDate(page, targetDate, retryCount + 1);
	}

	console.log('Found target day:', elementText);
	await waitForTargetDateBookingsAreVisible(page, targetDate);
}

async function selectNextDay(page: Page) {
	await withSelector(page, '.k-toolbar button[aria-label="Next"]', async (nextBtn) => {
		assertNonNullish(nextBtn, 'Next button not found');
		await nextBtn.click();
	});
}

async function waitForTargetDateBookingsAreVisible(page: Page, targetDate: Date) {
	console.log('Waiting for target date bookings to be visible...');

	await waitFor(async (elapsedTime) => {
		return with$$(page, '.k-scheduler-body .k-event', async (allBookings) => {
			const firstBooking = allBookings[0];
			if (!firstBooking) {
				// We have no way of knowing if it means there are no bookings for target date
				// or if there were no bookings for the previous date.
				// If enough time has elapsed we assume there are no bookings for the target date.
				return elapsedTime > 500;
			}

			const ariaLabel = await firstBooking.evaluate((el) => el.getAttribute('aria-label'));
			assertNonNullish(ariaLabel, 'aria-label not found on event element');

			allBookings.forEach((booking) => {
				booking.dispose();
			});

			const match = ariaLabel.match(resourceAndDateRegex);
			assertNonNullish(match, 'Failed to match resource and date from aria-label');

			const startDate = match[2];
			const [month, day] = startDate.split('/').map(Number);

			return month === targetDate.getMonth() + 1 && day === targetDate.getDate();
		});
	});

	console.log('Target date bookings are visible');
}
