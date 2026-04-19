import { describe, it, expect } from 'vitest';
import { getMiddayWeather } from './getMiddayWeather';
import type { WeatherResponseData, WeatherTimeEntry } from '$lib/types';

function localTime(day: number, hour: number): string {
	return new Date(2025, 0, day, hour, 0, 0).toISOString();
}

function createWeatherEntry(
	hour: number,
	options: {
		day?: number;
		temperature?: number;
		next12hSymbol?: string;
		next6hSymbol?: string;
	} = {}
): WeatherTimeEntry {
	return {
		time: localTime(options.day ?? 12, hour),
		data: {
			instant:
				options.temperature != null
					? { details: { air_temperature: options.temperature } }
					: undefined,
			next_12_hours: options.next12hSymbol
				? { summary: { symbol_code: options.next12hSymbol } }
				: undefined,
			next_6_hours: options.next6hSymbol
				? { summary: { symbol_code: options.next6hSymbol } }
				: undefined
		}
	};
}

function createWeatherData(timeseries: WeatherTimeEntry[]): WeatherResponseData {
	return { properties: { timeseries } };
}

describe('getMiddayWeather', () => {
	const targetDate = new Date(2025, 0, 12); // Sunday January 12, 2025

	it('returns empty/null values when weather is null', () => {
		const result = getMiddayWeather(null, targetDate);

		expect(result.targetDateWeatherEntryList).toEqual([]);
		expect(result.middayWeatherEntry).toBeUndefined();
		expect(result.middayWeatherSymbol).toBeNull();
		expect(result.middayWeatherLabel).toBeNull();
		expect(result.middayWeatherTemperature).toBeNull();
	});

	it('returns empty list when no entries match the target date', () => {
		const weather = createWeatherData([
			createWeatherEntry(12, { day: 11, temperature: 5, next12hSymbol: 'clearsky_day' })
		]);

		const result = getMiddayWeather(weather, targetDate);

		expect(result.targetDateWeatherEntryList).toEqual([]);
		expect(result.middayWeatherEntry).toBeUndefined();
	});

	it('filters entries to only the target date', () => {
		const weather = createWeatherData([
			createWeatherEntry(12, { day: 11, temperature: 3 }),
			createWeatherEntry(6, { temperature: 1 }),
			createWeatherEntry(12, { temperature: 5, next12hSymbol: 'clearsky_day' }),
			createWeatherEntry(12, { day: 13, temperature: 7 })
		]);

		const result = getMiddayWeather(weather, targetDate);

		expect(result.targetDateWeatherEntryList).toHaveLength(2);
		expect(result.targetDateWeatherEntryList.every((e) => e.date.getDate() === 12)).toBe(true);
	});

	it('selects midday entry between 11:00 and 14:00 with next_12_hours', () => {
		const weather = createWeatherData([
			createWeatherEntry(6, { temperature: 1, next12hSymbol: 'cloudy' }),
			createWeatherEntry(12, { temperature: 5, next12hSymbol: 'clearsky_day' }),
			createWeatherEntry(18, { temperature: 3, next12hSymbol: 'rain' })
		]);

		const result = getMiddayWeather(weather, targetDate);

		expect(result.middayWeatherEntry).toBeDefined();
		expect(result.middayWeatherEntry!.date.getHours()).toBe(12);
		expect(result.middayWeatherSymbol).toBe('clearsky_day');
		expect(result.middayWeatherTemperature).toBe(5);
	});

	it('prefers the earliest entry within the midday range', () => {
		const weather = createWeatherData([
			createWeatherEntry(11, { temperature: 4, next12hSymbol: 'fair_day' }),
			createWeatherEntry(13, { temperature: 6, next12hSymbol: 'cloudy' })
		]);

		const result = getMiddayWeather(weather, targetDate);

		expect(result.middayWeatherEntry!.date.getHours()).toBe(11);
		expect(result.middayWeatherSymbol).toBe('fair_day');
	});

	it('returns label from symbolCodeLabel mapping', () => {
		const weather = createWeatherData([
			createWeatherEntry(12, { temperature: 5, next12hSymbol: 'clearsky_day' })
		]);

		const result = getMiddayWeather(weather, targetDate);

		expect(result.middayWeatherLabel).toBe('sol');
	});

	it('returns null label for unknown symbol codes', () => {
		const weather = createWeatherData([
			createWeatherEntry(12, {
				temperature: 5,
				next12hSymbol: 'unknown_symbol'
			})
		]);

		const result = getMiddayWeather(weather, targetDate);

		expect(result.middayWeatherSymbol).toBe('unknown_symbol');
		expect(result.middayWeatherLabel).toBeNull();
	});

	it('excludes midday entries without next_12_hours', () => {
		const weather = createWeatherData([
			createWeatherEntry(12, { temperature: 5, next6hSymbol: 'rain' })
		]);

		const result = getMiddayWeather(weather, targetDate);

		expect(result.middayWeatherEntry).toBeUndefined();
	});

	it('uses next_6_hours symbol when next_12_hours has no symbol', () => {
		const weather = createWeatherData([
			{
				time: localTime(12, 12),
				data: {
					instant: { details: { air_temperature: 5 } },
					next_12_hours: {}, // present (passes filter) but no summary.symbol_code
					next_6_hours: { summary: { symbol_code: 'rain' } }
				}
			}
		]);

		const result = getMiddayWeather(weather, targetDate);

		expect(result.middayWeatherEntry).toBeDefined();
		expect(result.middayWeatherSymbol).toBe('rain');
	});

	it('skips entries without data', () => {
		const weather = createWeatherData([
			{ time: localTime(12, 12), data: {} } as WeatherTimeEntry,
			createWeatherEntry(13, { temperature: 7, next12hSymbol: 'rain' })
		]);

		const result = getMiddayWeather(weather, targetDate);

		expect(result.targetDateWeatherEntryList).toHaveLength(2);
		expect(result.middayWeatherEntry).toBeDefined();
		expect(result.middayWeatherSymbol).toBe('rain');
	});

	it('returns null temperature when instant details are missing', () => {
		const weather = createWeatherData([
			{
				time: localTime(12, 12),
				data: {
					next_12_hours: { summary: { symbol_code: 'cloudy' } }
				}
			}
		]);

		const result = getMiddayWeather(weather, targetDate);

		expect(result.middayWeatherSymbol).toBe('cloudy');
		expect(result.middayWeatherTemperature).toBeNull();
	});
});
