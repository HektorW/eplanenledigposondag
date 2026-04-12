import { describe, it, expect } from 'vitest';
import { createBookingEntry, getResourceIdFromIndex } from './createBookingEntry';
import { fullCourtId, halfCourtAId, halfCourtBId } from '$lib/ids';

describe('createBookingEntry', () => {
	it('preserves all provided fields', () => {
		const booking = createBookingEntry({
			bookingId: 'test-id',
			resourceId: fullCourtId,
			startTimeFormatted: '10:00',
			endTimeFormatted: '11:00',
			bookedBy: 'Test User',
			additionalInfo: 'Some info'
		});

		expect(booking).toEqual({
			bookingId: 'test-id',
			resourceId: fullCourtId,
			startTimeFormatted: '10:00',
			endTimeFormatted: '11:00',
			bookedBy: 'Test User',
			additionalInfo: 'Some info'
		});
	});

	it('generates a UUID when bookingId is omitted', () => {
		const booking = createBookingEntry({
			resourceId: fullCourtId,
			startTimeFormatted: '10:00',
			endTimeFormatted: '11:00',
			bookedBy: 'Test User'
		});

		expect(booking.bookingId).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
		);
	});

	it('defaults additionalInfo to null when not provided', () => {
		const booking = createBookingEntry({
			resourceId: fullCourtId,
			startTimeFormatted: '10:00',
			endTimeFormatted: '11:00',
			bookedBy: 'Test User'
		});

		expect(booking.additionalInfo).toBeNull();
	});
});

describe('getResourceIdFromIndex', () => {
	it('maps "1" to half court A', () => {
		expect(getResourceIdFromIndex('1')).toBe(halfCourtAId);
	});

	it('maps "2" to half court B', () => {
		expect(getResourceIdFromIndex('2')).toBe(halfCourtBId);
	});

	it('maps undefined to full court', () => {
		expect(getResourceIdFromIndex(undefined)).toBe(fullCourtId);
	});

	it('maps unknown values to full court', () => {
		expect(getResourceIdFromIndex('3')).toBe(fullCourtId);
		expect(getResourceIdFromIndex('0')).toBe(fullCourtId);
	});
});
