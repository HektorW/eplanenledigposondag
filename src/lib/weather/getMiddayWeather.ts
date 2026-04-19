import type { ParsedWeatherTimeEntry, WeatherResponseData } from '$lib/types';
import { APP_TIME_ZONE } from '$lib/utils';
import { symbolCodeLabel } from '$lib/weatherLabels';
import { Temporal } from '@js-temporal/polyfill';

export type MiddayWeather = {
	targetDateWeatherEntryList: ParsedWeatherTimeEntry[];
	middayWeatherSymbol: string | null;
	middayWeatherLabel: string | null;
	middayWeatherTemperature: number | null;
	middayWeatherEntry: ParsedWeatherTimeEntry | undefined;
};

export function getMiddayWeather(
	weather: WeatherResponseData | null,
	targetDate: Temporal.PlainDate
): MiddayWeather {
	const targetDateWeatherEntryList =
		weather?.properties.timeseries
			.map(
				(entry): ParsedWeatherTimeEntry => ({
					...entry,
					zoned: Temporal.Instant.from(entry.time).toZonedDateTimeISO(APP_TIME_ZONE)
				})
			)
			.filter((entry) => entry.zoned.toPlainDate().equals(targetDate)) ?? [];

	const middayWeatherEntry = targetDateWeatherEntryList
		.filter((entry) => entry.data)
		.filter((entry) => entry.zoned.hour >= 11 && entry.zoned.hour <= 14)
		.filter((entry) => entry.data.next_12_hours)
		.toSorted((a, b) => a.zoned.hour - b.zoned.hour)[0];

	const middayWeatherSymbol =
		(middayWeatherEntry?.data.next_12_hours ?? middayWeatherEntry?.data.next_6_hours)?.summary
			?.symbol_code ?? null;
	const middayWeatherLabel = (middayWeatherSymbol && symbolCodeLabel[middayWeatherSymbol]) ?? null;
	const middayWeatherTemperature =
		middayWeatherEntry?.data.instant?.details?.air_temperature ?? null;

	return {
		targetDateWeatherEntryList,
		middayWeatherSymbol,
		middayWeatherLabel,
		middayWeatherTemperature,
		middayWeatherEntry
	};
}
