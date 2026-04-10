import type { Booking } from '$lib/types';
import { scrapeCalendar } from './scrapeBlazor/scrapeCalendar';
import { createLogger } from './logger2';

const logger = createLogger('server:cache');

type CacheEntry = {
	bookings: Booking[];
	scrapedAt: string;
	targetDate: string;
};

let cached: CacheEntry | null = null;
let scraping: Promise<Booking[]> | null = null;

const STALE_AFTER_MS = 5 * 60 * 1000; // 5 minutes

function targetDateKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function isStale(): boolean {
	if (!cached) return true;
	return Date.now() - new Date(cached.scrapedAt).getTime() > STALE_AFTER_MS;
}

function isForDate(targetDate: Date): boolean {
	if (!cached) return false;
	return cached.targetDate === targetDateKey(targetDate);
}

/**
 * Returns current cache state without triggering a scrape.
 */
export function peekCache(targetDate: Date): CacheEntry | null {
	if (!cached || !isForDate(targetDate)) return null;
	return cached;
}

/**
 * Whether the cache is stale (or missing).
 */
export function cacheIsStale(targetDate: Date): boolean {
	return !cached || !isForDate(targetDate) || isStale();
}

/**
 * Triggers a background scrape if one isn't already running.
 * Returns a promise that resolves with fresh cache data.
 */
export function triggerBackgroundScrape(
	targetDate: Date
): Promise<{ bookings: Booking[]; scrapedAt: string }> {
	if (scraping) {
		logger.debug('Scrape already in progress, reusing existing promise');
		return scraping.then(() => ({
			bookings: cached!.bookings,
			scrapedAt: cached!.scrapedAt
		}));
	}

	logger.info('Starting background scrape');
	scraping = scrapeCalendar(targetDate)
		.then((bookings) => {
			cached = {
				bookings,
				scrapedAt: new Date().toISOString(),
				targetDate: targetDateKey(targetDate)
			};
			logger.info('Background scrape completed', { count: bookings.length });
			return bookings;
		})
		.finally(() => {
			scraping = null;
		});

	return scraping.then(() => ({
		bookings: cached!.bookings,
		scrapedAt: cached!.scrapedAt
	}));
}
