import type { Booking } from '$lib/types';
import type { Page } from 'puppeteer-core';
import { createBookingEntry } from './createBookingEntry';
import { resourceAndDateRegex } from './constants';
import { fullCourtId, halfCourtAId, halfCourtBId } from '$lib/ids';
import { createLogger } from '../logger2';

const logger = createLogger('scrapeBlazor:step5ScrapeBookings');

function getResourceIdFromIndex(index: string | undefined): string {
	switch (index) {
		case '1':
			return halfCourtAId;

		case '2':
			return halfCourtBId;

		default:
			return fullCourtId;
	}
}

export async function scrapeAllBookings(page: Page): Promise<Booking[]> {
	logger.debug('Scraping all bookings...');

	// Extract all booking data in a single page.evaluate call.
	// This replaces ~5 CDP round trips per booking element with 1 total call.
	const bookingsData = await page.evaluate((regexSource: string) => {
		const events = document.querySelectorAll('.k-scheduler-body .k-event');
		return Array.from(events).map((event) => {
			const ariaLabel = event.getAttribute('aria-label') ?? '';
			const match = ariaLabel.match(new RegExp(regexSource));

			const textElements = event.querySelectorAll('.text-truncate');
			const timeText = textElements[0]?.textContent?.trim() ?? '';
			const [startTimeFormatted = '', endTimeFormatted = ''] = timeText
				.split('-')
				.map((s) => s.trim());

			return {
				resourceIndex: match?.[1] as string | undefined,
				startTimeFormatted,
				endTimeFormatted,
				bookedBy: textElements[1]?.textContent?.trim() ?? '',
				additionalInfo: textElements[2]?.textContent?.trim() ?? null
			};
		});
	}, resourceAndDateRegex.source);

	logger.debug('Found event elements:', { count: bookingsData.length });

	const allBookings = bookingsData.map((data) =>
		createBookingEntry({
			resourceId: getResourceIdFromIndex(data.resourceIndex),
			startTimeFormatted: data.startTimeFormatted,
			endTimeFormatted: data.endTimeFormatted,
			bookedBy: data.bookedBy,
			additionalInfo: data.additionalInfo
		})
	);

	logger.debug('Total bookings created:', { count: allBookings.length });

	return allBookings;
}
