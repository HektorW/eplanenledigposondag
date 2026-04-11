import { loadBookings } from '$lib/server/cache';
import { fetchWeather } from '$lib/server/weather/fetchWeather';
import { getNextSundayDate } from '$lib/utils';

export async function load() {
	const nextSundayDate = getNextSundayDate();

	const [{ bookings, scrapedAt, fresh }, weatherResponse] = await Promise.all([
		loadBookings(nextSundayDate),
		fetchWeather()
	]);

	return {
		date: nextSundayDate,
		bookings,
		scrapedAt,
		fresh,
		weather: weatherResponse
	};
}
