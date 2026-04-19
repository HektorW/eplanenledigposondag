import { describe, it, expect } from 'vitest';
import { scrapeCalendar } from './scrapeCalendar';
import { getNextSundayDate, todayInAppTz } from '$lib/utils';
import { fullCourtId, halfCourtAId, halfCourtBId } from '$lib/ids';

const validResourceIds = [fullCourtId, halfCourtAId, halfCourtBId];

function expectValidBookingList(result: Awaited<ReturnType<typeof scrapeCalendar>>) {
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
}

describe('scrapeCalendar', () => {
	it('scrapes next Sunday', async () => {
		const targetDate = getNextSundayDate();
		const result = await scrapeCalendar(targetDate);
		expectValidBookingList(result);
	});

	it('scrapes a non-Sunday date', async () => {
		const tomorrow = todayInAppTz().add({ days: 1 });
		// Skip if tomorrow is Sunday — already covered above
		if (tomorrow.dayOfWeek === 7) return;

		const result = await scrapeCalendar(tomorrow);
		expectValidBookingList(result);
	});
});
