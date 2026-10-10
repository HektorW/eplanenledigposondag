import { getField, parseFieldId } from '$lib/fields';
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

	const fieldParam = url.searchParams.get('field');
	const { fieldId, usedFallback: usedFieldFallback } = parseFieldId(fieldParam);

	if (usedFieldFallback) {
		logger.warn('Invalid field param, falling back to default', { fieldParam });
	}

	const { fields, fresh } = await loadBookings(fieldId, targetDate);

	return {
		date: targetDate.toString(),
		fieldId,
		fields,
		fresh,
		// Streamed — the page shouldn't wait on met.no. Weather is decoration,
		// so a failure resolves to null instead of erroring the stream.
		weather: fetchWeather(getField(fieldId).weatherLocation).catch((error: unknown) => {
			logger.error('Failed to fetch weather', error);
			return null;
		})
	};
};
