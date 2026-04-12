import { describe, it, expect } from 'vitest';
import { scrapeCalendar } from './scrapeCalendar';
import { getNextSundayDate } from '$lib/utils';
import { fullCourtId, halfCourtAId, halfCourtBId } from '$lib/ids';

const validResourceIds = [fullCourtId, halfCourtAId, halfCourtBId];

describe('scrapeCalendar', () => {
	it('completes the scraping flow and returns a valid result', async () => {
		const targetDate = getNextSundayDate();
		const result = await scrapeCalendar(targetDate);

		expect(result).toBeInstanceOf(Array);

		for (const booking of result) {
			expect(booking).toHaveProperty('bookingId');
			expect(booking).toHaveProperty('resourceId');
			expect(booking).toHaveProperty('startTimeFormatted');
			expect(booking).toHaveProperty('endTimeFormatted');
			expect(booking).toHaveProperty('bookedBy');

			expect(typeof booking.bookingId).toBe('string');
			expect(validResourceIds).toContain(booking.resourceId);
			expect(booking.startTimeFormatted).toMatch(/^\d{1,2}:\d{2}$/);
			expect(booking.endTimeFormatted).toMatch(/^\d{1,2}:\d{2}$/);
			expect(typeof booking.bookedBy).toBe('string');
			expect(booking.bookedBy.length).toBeGreaterThan(0);
		}
	});
});
