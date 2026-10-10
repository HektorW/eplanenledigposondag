import { getField, parseFieldId } from '$lib/fields';
import { loadBookings } from '$lib/server/cache';
import { createLogger } from '$lib/server/logger';
import { fetchWeather, peekWeather } from '$lib/server/weather/fetchWeather';
import { parseTargetDate } from '$lib/utils';
import type { PageServerLoad } from './$types';

const logger = createLogger('page:server');

export const load: PageServerLoad = async ({ url }) => {
	const dateParam = url.searchParams.get('date');
	const { date: targetDate, usedFallback } = parseTargetDate(dateParam);

	if (usedFallback) {
		logger.warn('Invalid date param, falling back to default', { dateParam });
	}

	const fieldParam = url.searchParams.get('field');
	const { fieldId, usedFallback: usedFieldFallback } = parseFieldId(fieldParam);

	if (usedFieldFallback) {
		logger.warn('Invalid field param, falling back to default', { fieldParam });
	}

	const weatherLocation = getField(fieldId).weatherLocation;
	// Kick off before awaiting bookings so the two round-trips overlap.
	// Weather is decoration, so a failure resolves to null instead of erroring.
	const weatherFetch = fetchWeather(weatherLocation).catch((error: unknown) => {
		logger.error('Failed to fetch weather', error);
		return null;
	});

	const { bookings, scrapedAt, fresh } = await loadBookings(fieldId, targetDate);

	// Cached (or already fetched while bookings loaded) → rendered on the
	// server. Otherwise streamed so the page doesn't wait on met.no.
	const weather = peekWeather(weatherLocation);

	return {
		date: targetDate.toString(),
		fieldId,
		bookings,
		scrapedAt,
		fresh,
		weather,
		weatherPending: weather ? null : weatherFetch
	};
};
