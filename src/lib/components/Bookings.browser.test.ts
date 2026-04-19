import { render } from 'vitest-browser-svelte';
import { expect, test, describe } from 'vitest';
import Bookings from './Bookings.svelte';
import { fullCourtId, halfCourtAId, halfCourtBId } from '$lib/ids';
import type { Booking } from '$lib/types';

function createBooking(overrides: Partial<Booking> & Pick<Booking, 'resourceId'>): Booking {
	return {
		bookingId: crypto.randomUUID(),
		startTimeFormatted: '10:00',
		endTimeFormatted: '11:00',
		bookedBy: 'Test User',
		...overrides
	};
}

describe('Bookings', () => {
	test('renders booking name and formatted time', async () => {
		const screen = render(Bookings, {
			bookings: [
				createBooking({
					resourceId: halfCourtAId,
					startTimeFormatted: '10:00',
					endTimeFormatted: '11:00',
					bookedBy: 'Anna Svensson'
				})
			]
		});

		await expect.element(screen.getByText('Anna Svensson')).toBeVisible();
		await expect.element(screen.getByText('10:00 - 11:00')).toBeVisible();
	});

	test('renders bookings for all three court types', async () => {
		const screen = render(Bookings, {
			bookings: [
				createBooking({ resourceId: halfCourtAId, bookedBy: 'Half A Player' }),
				createBooking({ resourceId: halfCourtBId, bookedBy: 'Half B Player' }),
				createBooking({ resourceId: fullCourtId, bookedBy: 'Full Court Player' })
			]
		});

		await expect.element(screen.getByText('Half A Player')).toBeVisible();
		await expect.element(screen.getByText('Half B Player')).toBeVisible();
		await expect.element(screen.getByText('Full Court Player')).toBeVisible();
	});

	test('renders multiple bookings for the same court', async () => {
		const screen = render(Bookings, {
			bookings: [
				createBooking({
					resourceId: halfCourtAId,
					startTimeFormatted: '10:00',
					endTimeFormatted: '11:00',
					bookedBy: 'Morning Player'
				}),
				createBooking({
					resourceId: halfCourtAId,
					startTimeFormatted: '14:00',
					endTimeFormatted: '15:00',
					bookedBy: 'Afternoon Player'
				})
			]
		});

		await expect.element(screen.getByText('Morning Player')).toBeVisible();
		await expect.element(screen.getByText('Afternoon Player')).toBeVisible();
		await expect.element(screen.getByText('10:00 - 11:00')).toBeVisible();
		await expect.element(screen.getByText('14:00 - 15:00')).toBeVisible();
	});

	test('renders nothing for empty bookings', async () => {
		const screen = render(Bookings, { bookings: [] });

		expect(screen.getByRole('article').query()).toBeNull();
	});

	test('places half court A in a different column than half court B', async () => {
		const screen = render(Bookings, {
			bookings: [
				createBooking({ resourceId: halfCourtAId, bookedBy: 'A Player' }),
				createBooking({ resourceId: halfCourtBId, bookedBy: 'B Player' })
			]
		});

		await expect.element(screen.getByText('A Player')).toBeVisible();
		await expect.element(screen.getByText('B Player')).toBeVisible();

		const articles = screen.container.querySelectorAll('article');
		const columns = Array.from(articles).map((a) => a.style.gridColumn);
		// The two halves should be in different columns
		expect(columns[0]).not.toBe(columns[1]);
	});

	test('full court booking spans wider than half court', async () => {
		const screen = render(Bookings, {
			bookings: [
				createBooking({ resourceId: halfCourtAId, bookedBy: 'Half Player' }),
				createBooking({ resourceId: fullCourtId, bookedBy: 'Full Player' })
			]
		});

		await expect.element(screen.getByText('Half Player')).toBeVisible();
		await expect.element(screen.getByText('Full Player')).toBeVisible();

		const articles = screen.container.querySelectorAll('article');
		const halfColumn = articles[0].style.gridColumn;
		const fullColumn = articles[1].style.gridColumn;
		// Full court column spec should contain a span separator (e.g. "2 / 4")
		expect(fullColumn).toContain('/');
		expect(halfColumn).not.toContain('/');
	});
});
