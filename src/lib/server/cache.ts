import { Redis } from '@upstash/redis';
import { Temporal } from '@js-temporal/polyfill';
import { FIELD_LIST, type FieldId } from '$lib/fields';
import type { Booking, FieldSnapshot } from '$lib/types';
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

/** Reads every field's entry for one date — a single MGET when Redis is configured. */
async function readCacheForDate(
	fieldIdList: readonly FieldId[],
	targetDate: Temporal.PlainDate
): Promise<Map<FieldId, CacheEntry>> {
	const keyList = fieldIdList.map((fieldId) => cacheKey(fieldId, targetDate));
	const redis = getRedis();

	let entryList: (CacheEntry | null | undefined)[];
	if (redis) {
		try {
			entryList = await redis.mget<(CacheEntry | null)[]>(...keyList);
		} catch (error) {
			logger.error('Failed to read from Redis cache', error);
			entryList = [];
		}
	} else {
		entryList = keyList.map((key) => memoryCache.get(key));
	}

	const result = new Map<FieldId, CacheEntry>();
	fieldIdList.forEach((fieldId, index) => {
		const entry = entryList[index];
		if (entry) result.set(fieldId, entry);
	});
	return result;
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
 * Reads the cache for every field on `targetDate`, so the page can show each
 * field's status. Only `selectedFieldId` is scraped — when its entry is stale
 * or missing, `fresh` streams the result of a new scrape.
 */
export async function loadBookings(
	selectedFieldId: FieldId,
	targetDate: Temporal.PlainDate
): Promise<{
	fields: Record<FieldId, FieldSnapshot | null>;
	fresh: Promise<FreshResult> | null;
}> {
	const fieldIdList = FIELD_LIST.map((field) => field.id);
	const cached = await readCacheForDate(fieldIdList, targetDate);

	const fields = Object.fromEntries(
		fieldIdList.map((fieldId) => {
			const entry = cached.get(fieldId);
			const snapshot: FieldSnapshot | null = entry
				? { bookings: entry.bookings, scrapedAt: entry.scrapedAt, stale: isStale(entry) }
				: null;
			return [fieldId, snapshot];
		})
	) as Record<FieldId, FieldSnapshot | null>;

	const selected = fields[selectedFieldId];
	if (selected && !selected.stale) {
		logger.debug('Serving fresh cache', { selectedFieldId });
		return { fields, fresh: null };
	}

	logger.debug(
		selected ? 'Serving stale cache, streaming fresh scrape' : 'No cache, streaming initial scrape',
		{
			selectedFieldId
		}
	);
	return { fields, fresh: withPreemptSentinel(scrapeAndCache(selectedFieldId, targetDate)) };
}
