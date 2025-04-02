import type { Booking } from '$lib/types';
import type { Page } from 'puppeteer-core';
import { createBookingEntryFromEventElement } from './createBookingEntry';
import { with$$ } from './withElement';
import { createLogger } from '../logger2';

const logger = createLogger('scrapeBlazor:step5ScrapeBookings');

export async function scrapeAllBookings(page: Page): Promise<Booking[]> {
	return with$$(page, '.k-scheduler-body .k-event', async (allEventElements) => {
		logger.debug('Scraping all bookings...');

		logger.debug('Found event elements:', { count: allEventElements.length });

		const allBookings = await Promise.all(
			allEventElements.map((eventElement) => {
				return createBookingEntryFromEventElement(eventElement);
			})
		);

		logger.debug('Total bookings created:', { count: allBookings.length });

		return allBookings;
	});
}
