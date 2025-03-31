import type { WeatherResponseData } from '$lib/types';

export async function fetchWeather() {
	const weatherRequest = fetch(
		'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=55.59&lon=13.02',
		{
			headers: {
				'User-Agent': 'EPlanenLedigPoSondag/1.0 github.com/HektorW/eplanenledigposondag'
			}
		}
	);

	const weatherResponse = await weatherRequest;
	if (!weatherResponse.ok) {
		return null;
	}

	return weatherResponse.json() as Promise<WeatherResponseData>;
}
