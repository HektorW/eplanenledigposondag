import { render } from 'vitest-browser-svelte';
import { expect, test, describe } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import TimeAxis from './TimeAxis.svelte';
import type { ParsedWeatherTimeEntry } from '$lib/types';

function createWeatherEntry(
	hour: number,
	options: {
		next1hSymbol?: string;
		next6hSymbol?: string;
		temperature?: number;
		precipitationMin?: number;
		precipitationMax?: number;
		precipitationAmount?: number;
	} = {}
): ParsedWeatherTimeEntry {
	const zoned = Temporal.PlainDateTime.from({
		year: 2025,
		month: 1,
		day: 12,
		hour,
		minute: 0,
		second: 0
	}).toZonedDateTime('Europe/Stockholm');
	return {
		time: zoned.toInstant().toString(),
		zoned,
		data: {
			instant:
				options.temperature != null
					? { details: { air_temperature: options.temperature } }
					: undefined,
			next_1_hours:
				options.next1hSymbol ||
				options.precipitationMin != null ||
				options.precipitationAmount != null
					? {
							summary: options.next1hSymbol ? { symbol_code: options.next1hSymbol } : undefined,
							details: {
								precipitation_amount: options.precipitationAmount,
								precipitation_amount_min: options.precipitationMin,
								precipitation_amount_max: options.precipitationMax
							}
						}
					: undefined,
			next_6_hours: options.next6hSymbol
				? { summary: { symbol_code: options.next6hSymbol } }
				: undefined
		}
	};
}

describe('TimeAxis', () => {
	test('renders 10 hourly labels from 9:00 to 18:00', async () => {
		const screen = render(TimeAxis, { weatherEntries: [] });

		for (let hour = 9; hour <= 18; hour++) {
			await expect.element(screen.getByText(String(hour))).toBeVisible();
		}
	});

	test('renders weather icon when entry has next_1_hours symbol', async () => {
		const screen = render(TimeAxis, {
			weatherEntries: [createWeatherEntry(12, { next1hSymbol: 'clearsky_day' })]
		});

		await expect.element(screen.getByAltText('clearsky_day')).toBeVisible();
	});

	test('falls back to next_6_hours symbol when next_1_hours is missing', async () => {
		const screen = render(TimeAxis, {
			weatherEntries: [createWeatherEntry(12, { next6hSymbol: 'rain' })]
		});

		await expect.element(screen.getByAltText('rain')).toBeVisible();
	});

	test('renders temperature with one decimal place', async () => {
		const screen = render(TimeAxis, {
			weatherEntries: [createWeatherEntry(12, { temperature: 15.3, next1hSymbol: 'clearsky_day' })]
		});

		await expect.element(screen.getByText('15.3°')).toBeVisible();
	});

	test('renders precipitation range', async () => {
		const screen = render(TimeAxis, {
			weatherEntries: [
				createWeatherEntry(12, {
					next1hSymbol: 'rain',
					precipitationMin: 0.5,
					precipitationMax: 2.1
				})
			]
		});

		await expect.element(screen.getByText('0.5-2.1 mm')).toBeVisible();
	});

	test('does not render weather data for hours without entries', async () => {
		const screen = render(TimeAxis, {
			weatherEntries: [createWeatherEntry(12, { next1hSymbol: 'clearsky_day', temperature: 10 })]
		});

		// Hour 12 has weather
		await expect.element(screen.getByAltText('clearsky_day')).toBeVisible();

		// Other hours should not have weather images
		const allImages = screen.container.querySelectorAll('img');
		expect(allImages.length).toBe(1);
	});

	test('renders weather for multiple hours', async () => {
		const screen = render(TimeAxis, {
			weatherEntries: [
				createWeatherEntry(10, { next1hSymbol: 'clearsky_day', temperature: 8 }),
				createWeatherEntry(14, { next1hSymbol: 'rain', temperature: 12 })
			]
		});

		await expect.element(screen.getByText('8.0°')).toBeVisible();
		await expect.element(screen.getByText('12.0°')).toBeVisible();
	});

	test('does not render temperature when not available', async () => {
		const screen = render(TimeAxis, {
			weatherEntries: [createWeatherEntry(12, { next1hSymbol: 'clearsky_day' })]
		});

		// Icon should be visible but no degree symbol text
		await expect.element(screen.getByAltText('clearsky_day')).toBeVisible();
		expect(screen.getByText(/°/).query()).toBeNull();
	});
});
