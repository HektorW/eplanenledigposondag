import { describe, it, expect } from 'vitest';
import {
	CALENDAR_END_MINUTES,
	CALENDAR_START_MINUTES,
	clampToCalendar,
	hasConflict,
	minutesToGridRow,
	minutesToRowIndex
} from './calendar';
import { fullCourtId, halfCourtAId, halfCourtBId } from './ids';
import type { Booking } from './types';

function makeBooking(overrides: Partial<Booking> & Pick<Booking, 'resourceId'>): Booking {
	return {
		bookingId: overrides.bookingId ?? 'b',
		bookedBy: overrides.bookedBy ?? 'Someone',
		startTimeFormatted: overrides.startTimeFormatted ?? '10:00',
		endTimeFormatted: overrides.endTimeFormatted ?? '11:00',
		...overrides
	};
}

describe('minutesToGridRow', () => {
	it('maps the start of the calendar to row 2 (row 1 is the header)', () => {
		expect(minutesToGridRow(CALENDAR_START_MINUTES)).toBe(2);
	});

	it('advances one row per 15 minutes', () => {
		expect(minutesToGridRow(CALENDAR_START_MINUTES + 15)).toBe(3);
		expect(minutesToGridRow(CALENDAR_START_MINUTES + 60)).toBe(6);
	});

	it('maps the end of the calendar to the last row', () => {
		expect(minutesToGridRow(CALENDAR_END_MINUTES)).toBe(42);
	});
});

describe('minutesToRowIndex', () => {
	it('returns 0 at the calendar start', () => {
		expect(minutesToRowIndex(CALENDAR_START_MINUTES)).toBe(0);
	});

	it('advances one index per 15 minutes', () => {
		expect(minutesToRowIndex(CALENDAR_START_MINUTES + 15)).toBe(1);
		expect(minutesToRowIndex(CALENDAR_START_MINUTES + 60)).toBe(4);
	});
});

describe('hasConflict', () => {
	it('returns false when no bookings touch the suggestion', () => {
		const bookings = [
			makeBooking({
				resourceId: halfCourtAId,
				startTimeFormatted: '09:00',
				endTimeFormatted: '10:00'
			})
		];
		expect(hasConflict(bookings, 'a', 10 * 60, 60)).toBe(false);
	});

	it('returns true when a half-court booking overlaps', () => {
		const bookings = [
			makeBooking({
				resourceId: halfCourtAId,
				startTimeFormatted: '10:00',
				endTimeFormatted: '11:00'
			})
		];
		expect(hasConflict(bookings, 'a', 10 * 60 + 30, 60)).toBe(true);
	});

	it('ignores bookings on the other half court', () => {
		const bookings = [
			makeBooking({
				resourceId: halfCourtBId,
				startTimeFormatted: '10:00',
				endTimeFormatted: '11:00'
			})
		];
		expect(hasConflict(bookings, 'a', 10 * 60, 60)).toBe(false);
	});

	it('treats a full-court booking as conflicting for both halves', () => {
		const bookings = [
			makeBooking({
				resourceId: fullCourtId,
				startTimeFormatted: '10:00',
				endTimeFormatted: '11:00'
			})
		];
		expect(hasConflict(bookings, 'a', 10 * 60, 60)).toBe(true);
		expect(hasConflict(bookings, 'b', 10 * 60, 60)).toBe(true);
	});

	it('treats back-to-back bookings as non-conflicting', () => {
		const bookings = [
			makeBooking({
				resourceId: halfCourtAId,
				startTimeFormatted: '10:00',
				endTimeFormatted: '11:00'
			})
		];
		expect(hasConflict(bookings, 'a', 11 * 60, 60)).toBe(false);
		expect(hasConflict(bookings, 'a', 9 * 60, 60)).toBe(false);
	});
});

describe('clampToCalendar', () => {
	it('leaves ranges inside the calendar untouched', () => {
		expect(clampToCalendar(10 * 60, 11 * 60)).toEqual({ start: 10 * 60, end: 11 * 60 });
	});

	it('clamps a booking that starts before the calendar', () => {
		expect(clampToCalendar(8 * 60, 16 * 60)).toEqual({
			start: CALENDAR_START_MINUTES,
			end: 16 * 60
		});
	});

	it('clamps a booking that ends after the calendar', () => {
		expect(clampToCalendar(18 * 60, 22 * 60)).toEqual({
			start: 18 * 60,
			end: CALENDAR_END_MINUTES
		});
	});

	it('returns null for ranges entirely outside the calendar', () => {
		expect(clampToCalendar(7 * 60, CALENDAR_START_MINUTES)).toBeNull();
		expect(clampToCalendar(CALENDAR_END_MINUTES, 21 * 60)).toBeNull();
	});

	it('leaves the end alone with clampEnd: false', () => {
		expect(clampToCalendar(18 * 60, 22 * 60, { clampEnd: false })).toEqual({
			start: 18 * 60,
			end: 22 * 60
		});
		expect(clampToCalendar(20 * 60, 21 * 60 + 30, { clampEnd: false })).toEqual({
			start: 20 * 60,
			end: 21 * 60 + 30
		});
		expect(clampToCalendar(7 * 60, 8 * 60, { clampEnd: false })).toBeNull();
	});
});
