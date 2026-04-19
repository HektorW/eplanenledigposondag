import { loadBookings } from '$lib/server/cache';
import { createLogger } from '$lib/server/logger';
import { fetchWeather } from '$lib/server/weather/fetchWeather';
import { parseTargetDate } from '$lib/utils';
import type { PageServerLoad } from './$types';

const logger = createLogger('page:server');

export const load: PageServerLoad = async ({ url }) => {
	const dateParam = url.searchParams.get('date');
	const { date: targetDate, usedFallback } = parseTargetDate(dateParam);

	if (usedFallback) {
		logger.warn('Invalid date param, falling back to default', { dateParam });
	}

	const [{ bookings, scrapedAt, fresh }, weatherResponse] = await Promise.all([
		loadBookings(targetDate),
		fetchWeather()
	]);

	return {
		date: targetDate.toString(),
		bookings,
		scrapedAt,
		fresh,
		weather: weatherResponse
	};
};
