import { fullCourtId, halfCourtAId, halfCourtBId } from '$lib/ids';
import type { Booking, Court } from '$lib/types';
import { formattedTimeToMinutes } from '$lib/utils';

export const CALENDAR_START_HOUR = 9;
export const CALENDAR_END_HOUR = 19;
export const CALENDAR_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR;

export const CALENDAR_STEP_MINUTES = 15;
export const CALENDAR_ROWS_PER_HOUR = 60 / CALENDAR_STEP_MINUTES;
export const CALENDAR_ROWS = CALENDAR_HOURS * CALENDAR_ROWS_PER_HOUR;

export const CALENDAR_START_MINUTES = CALENDAR_START_HOUR * 60;
export const CALENDAR_END_MINUTES = CALENDAR_END_HOUR * 60;

export const DEFAULT_SUGGESTION_DURATION_MINUTES = 90;
export const FALLBACK_SUGGESTION_DURATION_MINUTES = 60;
export const MIN_SUGGESTION_DURATION_MINUTES = 30;

export const COURT_ID_LIST: readonly Court[] = ['a', 'b'] as const;

export const COURT_RESOURCE_ID: Record<Court, string> = {
	a: halfCourtAId,
	b: halfCourtBId
};

export const COURT_GRID_COLUMN: Record<Court, string> = {
	a: '2',
	b: '3'
};

export const COURT_LABEL: Record<Court, string> = {
	a: 'Ena halvan',
	b: 'Andra halvan'
};

export const FULL_COURT_GRID_COLUMN = '2 / 4';

/** Grid row for a given minute value; row 1 is the header. */
export function minutesToGridRow(minutes: number): number {
	return 2 + (minutes - CALENDAR_START_MINUTES) / CALENDAR_STEP_MINUTES;
}

/** Zero-based row index within the grid body, for canvas/geometry use. */
export function minutesToRowIndex(minutes: number): number {
	return (minutes - CALENDAR_START_MINUTES) / CALENDAR_STEP_MINUTES;
}

/**
 * Clamps a time range to the calendar hours. Returns null when nothing of the
 * range is left. Bookings often start before CALENDAR_START_HOUR (e.g. school
 * use 8–16); unclamped they map to negative grid rows, which CSS counts from
 * the end of the grid.
 *
 * The page grid grows implicit rows past CALENDAR_END_HOUR, so it only clamps
 * the start. The share image has a fixed canvas and also clamps the end.
 */
export function clampToCalendar(
	startMinutes: number,
	endMinutes: number,
	{ clampEnd = true }: { clampEnd?: boolean } = {}
): { start: number; end: number } | null {
	const start = Math.max(startMinutes, CALENDAR_START_MINUTES);
	const end = clampEnd ? Math.min(endMinutes, CALENDAR_END_MINUTES) : endMinutes;
	return start < end ? { start, end } : null;
}

/**
 * Snaps a range to the nearest grid step (CALENDAR_STEP_MINUTES). Bookings
 * can end on any minute (e.g. 17:00–18:25), and a fractional grid row is
 * invalid CSS — the block loses its placement entirely. Rounding to nearest
 * keeps back-to-back bookings touching without overlapping. Never collapses
 * a range below one step.
 */
export function snapToGridStep({ start, end }: { start: number; end: number }): {
	start: number;
	end: number;
} {
	const snap = (minutes: number) =>
		Math.round(minutes / CALENDAR_STEP_MINUTES) * CALENDAR_STEP_MINUTES;
	const snappedStart = snap(start);
	return { start: snappedStart, end: Math.max(snap(end), snappedStart + CALENDAR_STEP_MINUTES) };
}

/** Bookings shorter than this get a tighter layout. */
export const COMPACT_BOOKING_MAX_MINUTES = 60;

export function hasConflict(
	bookings: Booking[],
	court: Court,
	startMinutes: number,
	durationMinutes: number
): boolean {
	const courtId = COURT_RESOURCE_ID[court];
	const endMinutes = startMinutes + durationMinutes;
	return bookings.some((booking) => {
		if (booking.resourceId !== courtId && booking.resourceId !== fullCourtId) return false;
		const bookingStart = formattedTimeToMinutes(booking.startTimeFormatted);
		const bookingEnd = formattedTimeToMinutes(booking.endTimeFormatted);
		return startMinutes < bookingEnd && endMinutes > bookingStart;
	});
}
