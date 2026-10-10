import { Redis } from '@upstash/redis';
import { Temporal } from '@js-temporal/polyfill';
import type { FieldId } from '$lib/fields';
import type { Booking } from '$lib/types';
import { scrapeCalendar, ScrapePreemptedError } from './scrapeBlazor/scrapeCalendar';
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

function cacheKey(fieldId: FieldId, targetDate: Temporal.PlainDate): string {
	return `bookings:${fieldId}:${targetDate.toString()}`;
}

function isStale(entry: CacheEntry): boolean {
	return Date.now() - new Date(entry.scrapedAt).getTime() > STALE_AFTER_MS;
}

async function readCache(
	fieldId: FieldId,
	targetDate: Temporal.PlainDate
): Promise<CacheEntry | null> {
	const key = cacheKey(fieldId, targetDate);
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

async function writeCache(
	fieldId: FieldId,
	targetDate: Temporal.PlainDate,
	entry: CacheEntry
): Promise<void> {
	const key = cacheKey(fieldId, targetDate);
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

const inFlightScrapes = new Map<string, Promise<CacheEntry>>();

/**
 * Scrapes and persists results. Concurrent callers for the same field + date
 * share one in-flight scrape instead of each launching their own Puppeteer run.
 * The scrape itself owns its timeout (see scrapeCalendar) — here we only
 * dedupe by key.
 */
function scrapeAndCache(fieldId: FieldId, targetDate: Temporal.PlainDate): Promise<CacheEntry> {
	const key = cacheKey(fieldId, targetDate);

	const existing = inFlightScrapes.get(key);
	if (existing) {
		logger.debug('Joining in-flight scrape', { key });
		return existing;
	}

	logger.info('Scraping for cache...');
	const promise = (async () => {
		const bookings = await scrapeCalendar(fieldId, targetDate);
		const entry: CacheEntry = { bookings, scrapedAt: new Date().toISOString() };
		await writeCache(fieldId, targetDate, entry);
		logger.info('Scrape complete, cached', { key, count: bookings.length });
		return entry;
	})().finally(() => {
		inFlightScrapes.delete(key);
	});

	inFlightScrapes.set(key, promise);
	return promise;
}

export type FreshResult = { bookings: Booking[]; scrapedAt: string } | { preempted: true };

/**
 * Wraps the scrape promise so a preempt (newer scrape took the queue slot)
 * resolves to a sentinel instead of rejecting. Lets the streamed promise stay
 * a successful resolution — no SvelteKit 500 in dev logs and no error flicker
 * in the client effect when the user navigates between dates fast.
 */
function withPreemptSentinel(scrape: Promise<CacheEntry>): Promise<FreshResult> {
	return scrape.catch((err) => {
		if (err instanceof ScrapePreemptedError) {
			return { preempted: true } as const;
		}
		throw err;
	});
}

/**
 * Reads persistent cache for one field. Returns cached data + a streaming
 * promise for fresh data if stale or missing.
 */
export async function loadBookings(
	fieldId: FieldId,
	targetDate: Temporal.PlainDate
): Promise<{
	bookings: Booking[] | null;
	scrapedAt: string | null;
	fresh: Promise<FreshResult> | null;
}> {
	const cached = await readCache(fieldId, targetDate);

	if (cached && !isStale(cached)) {
		logger.debug('Serving fresh cache', { fieldId });
		return { bookings: cached.bookings, scrapedAt: cached.scrapedAt, fresh: null };
	}

	if (cached) {
		logger.debug('Serving stale cache, streaming fresh scrape', { fieldId });
		return {
			bookings: cached.bookings,
			scrapedAt: cached.scrapedAt,
			fresh: withPreemptSentinel(scrapeAndCache(fieldId, targetDate))
		};
	}

	// No cache — stream the scrape
	logger.info('No cache, streaming initial scrape', { fieldId });
	return {
		bookings: null,
		scrapedAt: null,
		fresh: withPreemptSentinel(scrapeAndCache(fieldId, targetDate))
	};
}
