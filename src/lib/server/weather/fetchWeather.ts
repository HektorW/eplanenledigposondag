import type { WeatherLocation } from '$lib/fields';
import type { WeatherResponseData } from '$lib/types';

const CACHE_TTL_MS = 10 * 60 * 1000;

type CachedWeather = { data: WeatherResponseData; expiresAt: number };

const cache = new Map<string, CachedWeather>();
const inFlight = new Map<string, Promise<WeatherResponseData | null>>();

/** met.no asks for at most 4 decimals — more precision just splits their cache (and ours). */
function roundCoordinate(value: number): string {
	return value.toFixed(4).replace(/\.?0+$/, '');
}

function locationKey({ lat, lon }: WeatherLocation): string {
	return `${roundCoordinate(lat)},${roundCoordinate(lon)}`;
}

async function fetchFresh(location: WeatherLocation): Promise<WeatherResponseData | null> {
	const params = new URLSearchParams({
		lat: roundCoordinate(location.lat),
		lon: roundCoordinate(location.lon)
	});
	const response = await fetch(
		`https://api.met.no/weatherapi/locationforecast/2.0/compact?${params.toString()}`,
		{
			headers: {
				'User-Agent': 'EPlanenLedigPoSondag/1.0 github.com/HektorW/eplanenledigposondag'
			}
		}
	);

	if (!response.ok) return null;
	return (await response.json()) as WeatherResponseData;
}

export async function fetchWeather(location: WeatherLocation) {
	const key = locationKey(location);

	const cached = cache.get(key);
	if (cached && cached.expiresAt > Date.now()) {
		return cached.data;
	}

	let pending = inFlight.get(key);
	if (!pending) {
		pending = fetchFresh(location)
			.then((data) => {
				if (data !== null) {
					cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
				}
				return data;
			})
			.finally(() => {
				inFlight.delete(key);
			});
		inFlight.set(key, pending);
	}

	return pending;
}
