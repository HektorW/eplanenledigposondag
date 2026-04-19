import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import type { Booking } from '$lib/types';

vi.mock('$lib/server/cache', () => ({
	loadBookings: vi.fn()
}));

vi.mock('$lib/server/weather/fetchWeather', () => ({
	fetchWeather: vi.fn()
}));

import { load } from './+page.server';
import { loadBookings } from '$lib/server/cache';
import { fetchWeather } from '$lib/server/weather/fetchWeather';

const mockLoadBookings = vi.mocked(loadBookings);
const mockFetchWeather = vi.mocked(fetchWeather);

type LoadEvent = Parameters<typeof load>[0];
type LoadResult = Exclude<Awaited<ReturnType<typeof load>>, void>;

function makeEvent(dateParam: string | null = null): LoadEvent {
	const url = new URL('http://localhost/');
	if (dateParam !== null) {
		url.searchParams.set('date', dateParam);
	}
	return { url } as unknown as LoadEvent;
}

async function runLoad(event: LoadEvent): Promise<LoadResult> {
	const result = await load(event);
	if (!result) throw new Error('load returned void');
	return result as LoadResult;
}

describe('+page.server.ts load', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-10T12:00:00Z'));
		vi.clearAllMocks();
		mockLoadBookings.mockResolvedValue({
			bookings: [],
			scrapedAt: '2025-01-12T12:00:00Z',
			fresh: null
		});
		mockFetchWeather.mockResolvedValue(null);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('defaults to next Sunday when date param is missing', async () => {
		const result = await runLoad(makeEvent());

		expect(typeof result.date).toBe('string');
		expect(Temporal.PlainDate.from(result.date).dayOfWeek).toBe(7);
		const passedDate = mockLoadBookings.mock.calls[0][0];
		expect(passedDate.dayOfWeek).toBe(7);
	});

	it('uses the date param when it is a valid date within range', async () => {
		// System time is frozen at 2025-01-10, so 2025-01-13 is 3 days ahead
		const result = await runLoad(makeEvent('2025-01-13'));

		expect(result.date).toBe('2025-01-13');
		expect(mockLoadBookings).toHaveBeenCalledOnce();
	});

	it('falls back to the default when date param is invalid', async () => {
		const result = await runLoad(makeEvent('not-a-date'));

		// Falls back to next Sunday
		expect(Temporal.PlainDate.from(result.date).dayOfWeek).toBe(7);
	});

	it('passes bookings and scrapedAt from cache through to the page', async () => {
		const bookings: Booking[] = [
			{
				bookingId: 'b1',
				resourceId: 'resource-1',
				startTimeFormatted: '10:00',
				endTimeFormatted: '11:00',
				bookedBy: 'Test User'
			}
		];
		mockLoadBookings.mockResolvedValue({
			bookings,
			scrapedAt: '2025-01-12T12:00:00Z',
			fresh: null
		});

		const result = await runLoad(makeEvent());

		expect(result.bookings).toBe(bookings);
		expect(result.scrapedAt).toBe('2025-01-12T12:00:00Z');
	});

	it('passes fresh promise through when cache is stale', async () => {
		const freshPromise = Promise.resolve({
			bookings: [] as Booking[],
			scrapedAt: '2025-01-12T12:30:00Z'
		});
		mockLoadBookings.mockResolvedValue({
			bookings: [],
			scrapedAt: '2025-01-12T12:00:00Z',
			fresh: freshPromise
		});

		const result = await runLoad(makeEvent());

		expect(result.fresh).toBe(freshPromise);
	});

	it('returns null fresh when cache is fresh', async () => {
		const result = await runLoad(makeEvent());

		expect(result.fresh).toBeNull();
	});

	it('passes weather response through', async () => {
		const weatherData = {
			properties: {
				timeseries: [
					{
						time: '2025-01-12T12:00:00Z',
						data: {
							instant: { details: { air_temperature: 5 } },
							next_12_hours: { summary: { symbol_code: 'clearsky_day' } }
						}
					}
				]
			}
		};
		mockFetchWeather.mockResolvedValue(weatherData);

		const result = await runLoad(makeEvent());

		expect(result.weather).toBe(weatherData);
	});
});
