import { Redis } from '@upstash/redis';
import type { Booking } from '$lib/types';
import { scrapeCalendar } from './scrapeBlazor/scrapeCalendar';
import { createLogger } from './logger2';
import { env } from '$env/dynamic/private';

const logger = createLogger('server:cache');

type CacheEntry = {
	bookings: Booking[];
	scrapedAt: string;
};

const STALE_AFTER_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 1 week

let redisInstance: Redis | null | undefined;

function getRedis(): Redis | null {
	if (redisInstance !== undefined) return redisInstance;

	if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
		logger.debug('Redis not configured, skipping persistent cache');
		redisInstance = null;
		return null;
	}

	redisInstance = new Redis({
		url: env.UPSTASH_REDIS_REST_URL,
		token: env.UPSTASH_REDIS_REST_TOKEN
	});
	return redisInstance;
}

function cacheKey(targetDate: Date): string {
	return `bookings:${targetDate.toISOString().slice(0, 10)}`;
}

function isStale(entry: CacheEntry): boolean {
	return Date.now() - new Date(entry.scrapedAt).getTime() > STALE_AFTER_MS;
}

async function readCache(targetDate: Date): Promise<CacheEntry | null> {
	const redis = getRedis();
	if (!redis) return null;

	try {
		const entry = await redis.get<CacheEntry>(cacheKey(targetDate));
		return entry ?? null;
	} catch (error) {
		logger.error('Failed to read from cache', error);
		return null;
	}
}

async function writeCache(targetDate: Date, entry: CacheEntry): Promise<void> {
	const redis = getRedis();
	if (!redis) return;

	try {
		await redis.set(cacheKey(targetDate), entry, { ex: CACHE_TTL_SECONDS });
		logger.debug('Wrote cache', { key: cacheKey(targetDate) });
	} catch (error) {
		logger.error('Failed to write to cache', error);
	}
}

/**
 * Scrapes and persists results. Returns the fresh data.
 */
async function scrapeAndCache(
	targetDate: Date
): Promise<{ bookings: Booking[]; scrapedAt: string }> {
	logger.info('Scraping for cache...');
	const bookings = await scrapeCalendar(targetDate);
	const entry: CacheEntry = { bookings, scrapedAt: new Date().toISOString() };
	await writeCache(targetDate, entry);
	logger.info('Scrape complete, cached', { count: bookings.length });
	return entry;
}

/**
 * Reads persistent cache. Returns cached data + a streaming promise for fresh data if stale.
 */
export async function loadBookings(targetDate: Date): Promise<{
	bookings: Booking[] | null;
	scrapedAt: string | null;
	fresh: Promise<{ bookings: Booking[]; scrapedAt: string }> | null;
}> {
	const cached = await readCache(targetDate);

	if (cached && !isStale(cached)) {
		logger.debug('Serving fresh cache');
		return { bookings: cached.bookings, scrapedAt: cached.scrapedAt, fresh: null };
	}

	if (cached) {
		logger.debug('Serving stale cache, streaming fresh scrape');
		return {
			bookings: cached.bookings,
			scrapedAt: cached.scrapedAt,
			fresh: scrapeAndCache(targetDate)
		};
	}

	// No cache — stream the scrape
	logger.info('No cache, streaming initial scrape');
	return {
		bookings: null,
		scrapedAt: null,
		fresh: scrapeAndCache(targetDate)
	};
}
