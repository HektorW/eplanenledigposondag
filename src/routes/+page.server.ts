import { scrapeCalendar } from '$lib/server/scrapeBlazor/scrapeCalendar';
import { fetchWeather } from '$lib/server/weather/fetchWeather';
import { getNextSundayDate } from '$lib/utils';

export async function load() {
	const nextSundayDate = getNextSundayDate();

	const scrapeCalendarPromise = scrapeCalendar(nextSundayDate);
	const weatherResponse = await fetchWeather();

	return {
		date: nextSundayDate,
		calendar: scrapeCalendarPromise,
		weather: weatherResponse
	};
}
