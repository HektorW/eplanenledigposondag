import type { ParsedWeatherTimeEntry, WeatherResponseData } from '$lib/types';
import { symbolCodeLabel } from '$lib/weatherLabels';

export type MiddayWeather = {
	targetDateWeatherEntryList: ParsedWeatherTimeEntry[];
	middayWeatherSymbol: string | null;
	middayWeatherLabel: string | null;
	middayWeatherTemperature: number | null;
	middayWeatherEntry: ParsedWeatherTimeEntry | undefined;
};

export function getMiddayWeather(
	weather: WeatherResponseData | null,
	targetDate: Date
): MiddayWeather {
	const targetDateWeatherEntryList =
		weather?.properties.timeseries
			.map((entry): ParsedWeatherTimeEntry => ({ ...entry, date: new Date(entry.time) }))
			.filter((entry) => entry.date.getDate() === targetDate.getDate()) ?? [];

	const middayWeatherEntry = targetDateWeatherEntryList
		.filter((entry) => entry.data)
		.filter((entry) => entry.date.getHours() >= 11 && entry.date.getHours() <= 14)
		.filter((entry) => entry.data.next_12_hours)
		.toSorted((a, b) => a.date.getHours() - b.date.getHours())[0];

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
