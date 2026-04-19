import { render } from 'vitest-browser-svelte';
import { expect, test, describe } from 'vitest';
import Calendar from './Calendar.svelte';
import { halfCourtAId, halfCourtBId } from '$lib/ids';
import type { Booking } from '$lib/types';

describe('Calendar', () => {
	test('renders header with court labels', async () => {
		const screen = render(Calendar, { bookings: [], weatherEntries: [] });

		await expect.element(screen.getByText('Ena halvan')).toBeVisible();
		await expect.element(screen.getByText('Andra halvan')).toBeVisible();
	});

	test('renders time axis hours', async () => {
		const screen = render(Calendar, { bookings: [], weatherEntries: [] });

		// TimeAxis renders hours 9-18
		await expect.element(screen.getByText('9')).toBeVisible();
		await expect.element(screen.getByText('18')).toBeVisible();
	});

	test('renders bookings within the calendar', async () => {
		const bookings: Booking[] = [
			{
				bookingId: 'test-1',
				resourceId: halfCourtAId,
				startTimeFormatted: '10:00',
				endTimeFormatted: '11:00',
				bookedBy: 'Calendar Test Player'
			}
		];

		const screen = render(Calendar, { bookings, weatherEntries: [] });

		await expect.element(screen.getByText('Calendar Test Player')).toBeVisible();
		await expect.element(screen.getByText('10:00 - 11:00')).toBeVisible();
	});

	test('renders bookings on both halves', async () => {
		const bookings: Booking[] = [
			{
				bookingId: 'a-1',
				resourceId: halfCourtAId,
				startTimeFormatted: '10:00',
				endTimeFormatted: '11:00',
				bookedBy: 'Player A'
			},
			{
				bookingId: 'b-1',
				resourceId: halfCourtBId,
				startTimeFormatted: '12:00',
				endTimeFormatted: '13:00',
				bookedBy: 'Player B'
			}
		];

		const screen = render(Calendar, { bookings, weatherEntries: [] });

		await expect.element(screen.getByText('Player A')).toBeVisible();
		await expect.element(screen.getByText('Player B')).toBeVisible();
	});
});
