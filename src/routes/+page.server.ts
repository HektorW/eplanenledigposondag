import { peekCache, cacheIsStale, triggerBackgroundScrape } from '$lib/server/cache';
import { fetchWeather } from '$lib/server/weather/fetchWeather';
import { getNextSundayDate } from '$lib/utils';

export async function load() {
	const nextSundayDate = getNextSundayDate();
	const weatherResponse = await fetchWeather();
	const cached = peekCache(nextSundayDate);
	const stale = cacheIsStale(nextSundayDate);

	// If stale or missing, start a background scrape and stream the result
	const fresh = stale ? triggerBackgroundScrape(nextSundayDate) : null;

	return {
		date: nextSundayDate,
		bookings: cached?.bookings ?? null,
		scrapedAt: cached?.scrapedAt ?? null,
		fresh,
		weather: weatherResponse
	};
}
