import { describe, expect, it } from 'vitest';
import { tick } from 'svelte';
import { render } from 'vitest-browser-svelte';
import {
	CALENDAR_END_MINUTES,
	CALENDAR_START_MINUTES,
	COURT_GRID_COLUMN,
	DEFAULT_SUGGESTION_DURATION_MINUTES,
	minutesToGridRow
} from '$lib/calendar';
import { fullCourtId, halfCourtAId, halfCourtBId } from '$lib/ids';
import type { Booking, Court } from '$lib/types';
import Calendar from './Calendar.svelte';

type Screen = ReturnType<typeof render>;

function makeBooking(overrides: Partial<Booking> & Pick<Booking, 'resourceId'>): Booking {
	return {
		bookingId: 'b',
		bookedBy: 'Someone',
		startTimeFormatted: '10:00',
		endTimeFormatted: '11:00',
		...overrides
	};
}

async function clickCourtAt(screen: Screen, court: Court, yFromTop: number | 'bottom') {
	const locator = screen.getByTestId(`court-click-target-${court}`);
	const element = locator.element();
	element.scrollIntoView({ block: yFromTop === 'bottom' ? 'end' : 'start' });
	const rect = element.getBoundingClientRect();
	// A tiny inset avoids flakiness from sub-pixel rounding at the exact edge.
	const y = yFromTop === 'bottom' ? rect.height - 2 : yFromTop;
	await locator.click({ position: { x: rect.width / 2, y } });
}

function suggestionElement(): HTMLElement | null {
	return document.querySelector<HTMLElement>('.suggestion');
}

function expectedGridRow(startMinutes: number, durationMinutes: number): string {
	return `${minutesToGridRow(startMinutes)} / ${minutesToGridRow(startMinutes + durationMinutes)}`;
}

describe('Calendar court click', () => {
	it('places a suggestion on court A when the court A area is clicked', async () => {
		const screen = render(Calendar, { props: { bookings: [], weatherEntries: [] } });

		await clickCourtAt(screen, 'a', 1);

		await expect.poll(() => suggestionElement()?.style.gridColumn).toBe(COURT_GRID_COLUMN.a);
	});

	it('places a suggestion on court B when the court B area is clicked', async () => {
		const screen = render(Calendar, { props: { bookings: [], weatherEntries: [] } });

		await clickCourtAt(screen, 'b', 1);

		await expect.poll(() => suggestionElement()?.style.gridColumn).toBe(COURT_GRID_COLUMN.b);
	});

	it('clamps the suggestion to CALENDAR_START_MINUTES when clicked at the top', async () => {
		const screen = render(Calendar, { props: { bookings: [], weatherEntries: [] } });

		await clickCourtAt(screen, 'a', 1);

		await expect
			.poll(() => suggestionElement()?.style.gridRow)
			.toBe(expectedGridRow(CALENDAR_START_MINUTES, DEFAULT_SUGGESTION_DURATION_MINUTES));
	});

	it('clamps the suggestion so it ends at CALENDAR_END_MINUTES when clicked at the bottom', async () => {
		const screen = render(Calendar, { props: { bookings: [], weatherEntries: [] } });

		await clickCourtAt(screen, 'a', 'bottom');

		await expect
			.poll(() => suggestionElement()?.style.gridRow)
			.toBe(
				expectedGridRow(
					CALENDAR_END_MINUTES - DEFAULT_SUGGESTION_DURATION_MINUTES,
					DEFAULT_SUGGESTION_DURATION_MINUTES
				)
			);
	});

	it('does not place a suggestion when the clamped range overlaps a half-court booking', async () => {
		// Booking blocks 09:30–10:30 on court A. Click at the very top clamps to 09:00–10:00,
		// which overlaps the booking, so no suggestion is placed.
		const bookings = [
			makeBooking({
				resourceId: halfCourtAId,
				startTimeFormatted: '9:30',
				endTimeFormatted: '10:30'
			})
		];
		const screen = render(Calendar, { props: { bookings, weatherEntries: [] } });

		await clickCourtAt(screen, 'a', 1);
		await tick();

		expect(suggestionElement()).toBeNull();
	});

	it('blocks suggestions on both halves when the clamped range overlaps a full-court booking', async () => {
		const bookings = [
			makeBooking({
				resourceId: fullCourtId,
				startTimeFormatted: '9:30',
				endTimeFormatted: '10:30'
			})
		];
		const screen = render(Calendar, { props: { bookings, weatherEntries: [] } });

		await clickCourtAt(screen, 'a', 1);
		await tick();
		expect(suggestionElement()).toBeNull();

		await clickCourtAt(screen, 'b', 1);
		await tick();
		expect(suggestionElement()).toBeNull();
	});

	it('ignores bookings on the opposite half court when choosing a suggestion', async () => {
		const bookings = [
			makeBooking({
				resourceId: halfCourtBId,
				startTimeFormatted: '9:30',
				endTimeFormatted: '10:30'
			})
		];
		const screen = render(Calendar, { props: { bookings, weatherEntries: [] } });

		await clickCourtAt(screen, 'a', 1);

		await expect.poll(() => suggestionElement()?.style.gridColumn).toBe(COURT_GRID_COLUMN.a);
	});
});
