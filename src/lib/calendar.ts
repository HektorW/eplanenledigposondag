import { fullCourtId, halfCourtAId, halfCourtBId } from '$lib/ids';
import type { Booking } from '$lib/types';
import { formattedTimeToMinutes } from '$lib/utils';

export const CALENDAR_START_HOUR = 9;
export const CALENDAR_END_HOUR = 19;
export const CALENDAR_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR;

export const CALENDAR_STEP_MINUTES = 15;
export const CALENDAR_ROWS_PER_HOUR = 60 / CALENDAR_STEP_MINUTES;
export const CALENDAR_ROWS = CALENDAR_HOURS * CALENDAR_ROWS_PER_HOUR;

export const CALENDAR_START_MINUTES = CALENDAR_START_HOUR * 60;
export const CALENDAR_END_MINUTES = CALENDAR_END_HOUR * 60;

export const DEFAULT_SUGGESTION_DURATION_MINUTES = 60;
export const MIN_SUGGESTION_DURATION_MINUTES = 30;

/** Grid row for a given minute value; row 1 is the header. */
export function minutesToGridRow(minutes: number): number {
	return 2 + (minutes - CALENDAR_START_MINUTES) / CALENDAR_STEP_MINUTES;
}

/** Zero-based row index within the grid body, for canvas/geometry use. */
export function minutesToRowIndex(minutes: number): number {
	return (minutes - CALENDAR_START_MINUTES) / CALENDAR_STEP_MINUTES;
}

export function hasConflict(
	bookings: Booking[],
	court: 'a' | 'b',
	startMinutes: number,
	durationMinutes: number
): boolean {
	const courtId = court === 'a' ? halfCourtAId : halfCourtBId;
	const endMinutes = startMinutes + durationMinutes;
	return bookings.some((booking) => {
		if (booking.resourceId !== courtId && booking.resourceId !== fullCourtId) return false;
		const bookingStart = formattedTimeToMinutes(booking.startTimeFormatted);
		const bookingEnd = formattedTimeToMinutes(booking.endTimeFormatted);
		return startMinutes < bookingEnd && endMinutes > bookingStart;
	});
}
