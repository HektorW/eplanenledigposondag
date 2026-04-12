import { Redis } from '@upstash/redis';
import type { Booking } from '$lib/types';
import { scrapeCalendar } from './scrapeBlazor/scrapeCalendar';
import { createLogger } from './logger';
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

	if (!env.UPSTASH_KV_REST_API_URL || !env.UPSTASH_KV_REST_API_TOKEN) {
		logger.debug('Redis not configured, skipping persistent cache');
		redisInstance = null;
		return null;
	}

	redisInstance = new Redis({
		url: env.UPSTASH_KV_REST_API_URL,
		token: env.UPSTASH_KV_REST_API_TOKEN
	});
	return redisInstance;
}

const memoryCache = new Map<string, CacheEntry>();

function cacheKey(targetDate: Date): string {
	return `bookings:${targetDate.toISOString().slice(0, 10)}`;
}

function isStale(entry: CacheEntry): boolean {
	return Date.now() - new Date(entry.scrapedAt).getTime() > STALE_AFTER_MS;
}

async function readCache(targetDate: Date): Promise<CacheEntry | null> {
	const key = cacheKey(targetDate);
	const redis = getRedis();

	if (redis) {
		try {
			const entry = await redis.get<CacheEntry>(key);
			return entry ?? null;
		} catch (error) {
			logger.error('Failed to read from Redis cache', error);
			return null;
		}
	}

	return memoryCache.get(key) ?? null;
}

async function writeCache(targetDate: Date, entry: CacheEntry): Promise<void> {
	const key = cacheKey(targetDate);
	const redis = getRedis();

	if (redis) {
		try {
			await redis.set(key, entry, { ex: CACHE_TTL_SECONDS });
			logger.debug('Wrote Redis cache', { key });
		} catch (error) {
			logger.error('Failed to write to Redis cache', error);
		}
		return;
	}

	memoryCache.set(key, entry);
	logger.debug('Wrote in-memory cache', { key });
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
