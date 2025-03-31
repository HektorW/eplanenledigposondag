import type { Booking } from '$lib/types';
import type { Page } from 'puppeteer-core';
import { createBookingEntryFromEventElement } from './createBookingEntry';
import { with$$ } from './withElement';

export async function scrapeAllBookings(page: Page): Promise<Booking[]> {
	return with$$(page, '.k-scheduler-body .k-event', async (allEventElements) => {
		console.log('Scraping all bookings...');

		console.log('Found event elements:', { count: allEventElements.length });

		const allBookings = await Promise.all(
			allEventElements.map((eventElement) => {
				return createBookingEntryFromEventElement(eventElement);
			})
		);

		console.log('Total bookings created:', { count: allBookings.length });

		return allBookings;
	});
}
