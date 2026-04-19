import type { WeatherResponseData } from '$lib/types';
import { Temporal } from '@js-temporal/polyfill';

const CACHE_TTL_MS = 10 * 60 * 1000;

let cached: { data: WeatherResponseData; expiresAt: number } | null = null;
let inFlight: Promise<WeatherResponseData | null> | null = null;

async function fetchFresh(): Promise<WeatherResponseData | null> {
	const response = await fetch(
		'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=55.59&lon=13.02',
		{
			headers: {
				'User-Agent': 'EPlanenLedigPoSondag/1.0 github.com/HektorW/eplanenledigposondag'
			}
		}
	);

	if (!response.ok) return null;
	return (await response.json()) as WeatherResponseData;
}

export async function fetchWeather() {
	if (cached && cached.expiresAt > Temporal.Now.instant().epochMilliseconds) {
		return cached.data;
	}

	inFlight ??= fetchFresh()
		.then((data) => {
			if (data !== null) {
				cached = {
					data,
					expiresAt: Temporal.Now.instant().epochMilliseconds + CACHE_TTL_MS
				};
			}
			return data;
		})
		.finally(() => {
			inFlight = null;
		});

	return inFlight;
}
