import { Temporal } from '@js-temporal/polyfill';
import type { Booking } from '$lib/types';
import { createLogger } from '../logger';
import { forceResetBrowser, withBrowserAndPage } from './getBrowser';
import { waitUntilPageIsLoaded } from './step1WaitUntilPageIsLoaded';
import { searchForSorgenfri } from './step2SearchForSorgenfri';
import { selectDayView } from './step3SelectDayView';
import { selectTargetDate } from './step4SelectTargetDate';
import { scrapeAllBookings } from './step5ScrapeBookings';

const baseUrl = 'https://malmo.rbok.se/boka-resurser';

const logger = createLogger('scrapeBlazor:scrapeCalendar');

const blockedResourceTypes = new Set(['image', 'font', 'media']);

export class ScrapePreemptedError extends Error {
	constructor() {
		super('Preempted by newer scrape request');
		this.name = 'ScrapePreemptedError';
	}
}

// Run one scrape at a time — concurrent Puppeteer sessions against the same
// Blazor app overwhelm it (5s waits time out, day navigation can't keep up).
// Queue depth is 1: a newer request preempts the queued one so the date the
// user is actually viewing jumps ahead of stale intermediate clicks.
type QueuedTask = {
	run: () => Promise<void>;
	preempt: () => void;
};

let isRunning = false;
let queuedTask: QueuedTask | null = null;

const SCRAPE_TIMEOUT_MS = 40_000;

function pump() {
	if (isRunning || !queuedTask) return;
	const task = queuedTask;
	queuedTask = null;
	isRunning = true;
	task.run().finally(() => {
		isRunning = false;
		pump();
	});
}

function runWithPreempt<T>(work: () => Promise<T>): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		if (queuedTask) queuedTask.preempt();
		queuedTask = {
			run: () => work().then(resolve, reject),
			preempt: () => reject(new ScrapePreemptedError())
		};
		pump();
	});
}

export async function scrapeCalendar(targetDate: Temporal.PlainDate): Promise<Booking[]> {
	logger.info('Scraping blazor calendar...');
	logger.debug('Target date:', targetDate.toString());

	// Timeout starts *after* the queue grants a slot, not when the caller
	// arrived. A scrape that sits in queue behind a long-running one would
	// otherwise exhaust its budget before doing any real work.
	return runWithPreempt(() => withTimeout(doScrape(targetDate), SCRAPE_TIMEOUT_MS));
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			// Nuke the shared browser so the abandoned Puppeteer ops inside `work`
			// reject quickly and we don't leak a zombie scrape that keeps driving
			// Blazor concurrently with the next one.
			forceResetBrowser();
			reject(new Error(`Scrape timed out after ${ms}ms`));
		}, ms);
		work.then(
			(value) => {
				clearTimeout(timeoutId);
				resolve(value);
			},
			(err) => {
				clearTimeout(timeoutId);
				reject(err);
			}
		);
	});
}

async function doScrape(targetDate: Temporal.PlainDate): Promise<Booking[]> {
	const allBookings = await withBrowserAndPage<Booking[]>(
		{
			defaultViewport: { width: 1200, height: 1024 },
			headless: true
		},
		async (browser, page) => {
			await page.setRequestInterception(true);
			page.on('request', (request) => {
				if (blockedResourceTypes.has(request.resourceType())) {
					request.abort();
				} else {
					request.continue();
				}
			});

			logger.debug('Navigating to URL:', baseUrl);
			await page.goto(`${baseUrl}`, { waitUntil: 'domcontentloaded' });

			await waitUntilPageIsLoaded(page);
			await searchForSorgenfri(page);
			await selectDayView(page);
			await selectTargetDate(page, targetDate);

			return scrapeAllBookings(page);
		}
	);

	logger.info('Finished scraping calendar');
	logger.debug(allBookings);

	return allBookings;
}
