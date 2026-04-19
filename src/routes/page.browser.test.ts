import { render } from 'vitest-browser-svelte';
import { expect, test, describe, vi } from 'vitest';
import Page from './+page.svelte';
import type { Booking, WeatherResponseData } from '$lib/types';

// Mock $app/environment for the page component
vi.mock('$app/environment', () => ({
	browser: true,
	dev: true,
	prerendering: false
}));

type PageData = {
	date: Date;
	bookings: Booking[] | null;
	scrapedAt: string | null;
	fresh: Promise<{ bookings: Booking[]; scrapedAt: string }> | null;
	weather: WeatherResponseData | null;
};

function createPageData(overrides: Partial<PageData> = {}): PageData {
	return {
		date: new Date('2025-01-12T12:00:00Z'),
		bookings: [],
		scrapedAt: '2025-01-12T12:00:00Z',
		fresh: null,
		weather: null,
		...overrides
	};
}

describe('+page.svelte', () => {
	test('renders the title', async () => {
		const screen = render(Page, { data: createPageData() });

		await expect.element(screen.getByRole('heading', { name: /Söndagsboll/ })).toBeVisible();
	});

	test('renders the date in Swedish locale', async () => {
		const screen = render(Page, {
			data: createPageData({ date: new Date('2025-01-12T12:00:00Z') })
		});

		// Wait for the page to render before reading DOM
		await expect.element(screen.getByRole('heading', { name: /Söndagsboll/ })).toBeVisible();

		const timeEl = screen.container.querySelector('time');
		expect(timeEl).not.toBeNull();
		expect(timeEl?.textContent).toContain('januari');
	});

	test('shows Calendar with bookings when data is available', async () => {
		const bookings: Booking[] = [
			{
				bookingId: 'b1',
				resourceId: '19444fe5-e625-4ca8-8b4c-d699bb1dfc7d',
				startTimeFormatted: '10:00',
				endTimeFormatted: '11:00',
				bookedBy: 'Integration Test Player'
			}
		];

		const screen = render(Page, {
			data: createPageData({ bookings, scrapedAt: '2025-01-12T12:00:00Z' })
		});

		// Calendar headers
		await expect.element(screen.getByText('Ena halvan')).toBeVisible();
		await expect.element(screen.getByText('Andra halvan')).toBeVisible();
		// Booking data
		await expect.element(screen.getByText('Integration Test Player')).toBeVisible();
	});

	test('shows FreshnessIndicator when data is available', async () => {
		const screen = render(Page, {
			data: createPageData({
				bookings: [],
				scrapedAt: '2025-01-12T12:00:00Z'
			})
		});

		await expect.element(screen.getByRole('status')).toBeVisible();
	});

	test('shows BigLoader when loading fresh data with no cache', async () => {
		// fresh promise that never resolves (simulates loading)
		const neverResolves = new Promise<{ bookings: Booking[]; scrapedAt: string }>(() => {});

		const screen = render(Page, {
			data: createPageData({
				bookings: null,
				scrapedAt: null,
				fresh: neverResolves
			})
		});

		// BigLoader should be visible — check for the bouncy loader section
		await expect.element(screen.getByText('Letar efter lediga tider...')).toBeVisible();
	});

	test('shows error state when scrape fails and no cache', async () => {
		// A fresh promise that rejects immediately
		const failedPromise = Promise.reject(new Error('Scrape failed'));
		// Suppress unhandled rejection
		failedPromise.catch(() => {});

		const screen = render(Page, {
			data: createPageData({
				bookings: null,
				scrapedAt: null,
				fresh: failedPromise
			})
		});

		// Wait for the error state to appear
		await expect.element(screen.getByText(/Nåt gick riktigt snett/)).toBeVisible();
	});

	test('shows weather info in meta when weather data is available', async () => {
		const weather: WeatherResponseData = {
			properties: {
				timeseries: [
					{
						time: '2025-01-12T12:00:00Z',
						data: {
							instant: { details: { air_temperature: 5.2 } },
							next_12_hours: { summary: { symbol_code: 'clearsky_day' } }
						}
					}
				]
			}
		};

		const screen = render(Page, {
			data: createPageData({ weather, bookings: [], scrapedAt: '2025-01-12T12:00:00Z' })
		});

		// The meta paragraph should show both temperature and weather label
		const meta = screen.container.querySelector('.meta');
		expect(meta).not.toBeNull();
		// Wait for render to complete
		await expect.element(screen.getByText('Ena halvan')).toBeVisible();
		// Now check the meta content
		expect(meta?.textContent).toContain('5.2°');
		expect(meta?.textContent).toContain('sol');
	});

	test('shows stale data with refreshing indicator when fresh is loading', async () => {
		const neverResolves = new Promise<{ bookings: Booking[]; scrapedAt: string }>(() => {});

		const screen = render(Page, {
			data: createPageData({
				bookings: [
					{
						bookingId: 'stale-1',
						resourceId: '19444fe5-e625-4ca8-8b4c-d699bb1dfc7d',
						startTimeFormatted: '10:00',
						endTimeFormatted: '11:00',
						bookedBy: 'Stale Player'
					}
				],
				scrapedAt: '2025-01-12T11:00:00Z',
				fresh: neverResolves
			})
		});

		// Should show the stale booking data
		await expect.element(screen.getByText('Stale Player')).toBeVisible();
		// Should show refreshing indicator
		await expect.element(screen.getByText(/Uppdaterar/)).toBeVisible();
	});
});
