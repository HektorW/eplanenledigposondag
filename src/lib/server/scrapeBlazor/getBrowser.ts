import puppeteerCore, { Page, type Browser, type LaunchOptions } from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { createLogger } from '../logger';

const logger = createLogger('scrapeBlazor:getBrowser');

const remoteExecutablePath =
	'https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.x64.tar';

const useSystemChrome = process.env.NODE_ENV !== 'production';
let sharedBrowser: Browser | null = null;
let launchPromise: Promise<Browser> | null = null;
let activeUsers = 0;

type BrowserOptions = Pick<LaunchOptions, 'defaultViewport' | 'headless'>;

export async function getBrowser(options?: BrowserOptions): Promise<Browser> {
	if (sharedBrowser?.connected) {
		activeUsers++;
		return sharedBrowser;
	}

	if (!launchPromise) {
		logger.debug('Creating new browser instance', { useSystemChrome });

		const baseArgs = ['--locale=en-US', '--accept-lang=en-US'];

		launchPromise = puppeteerCore
			.launch({
				...options,
				...(useSystemChrome
					? {
							channel: 'chrome',
							args: [...baseArgs, '--disable-dev-shm-usage', '--no-sandbox'],
							headless: options?.headless ?? true
						}
					: {
							headless: true,
							args: [...chromium.args, ...baseArgs],
							executablePath: await chromium.executablePath(remoteExecutablePath),
							ignoreHTTPSErrors: true
						})
			})
			.then((browser) => {
				sharedBrowser = browser;
				return browser;
			})
			.finally(() => {
				launchPromise = null;
			});
	}

	const browser = await launchPromise;
	activeUsers++;
	return browser;
}

export async function disposeBrowser() {
	activeUsers = Math.max(0, activeUsers - 1);
	if (activeUsers > 0) return;
	if (!sharedBrowser) return;
	if (!useSystemChrome) return;

	const browser = sharedBrowser;
	sharedBrowser = null;
	try {
		await browser.close();
	} catch (error) {
		logger.debug('Error closing shared browser', error);
	}
}

/**
 * Hard reset for when a scrape times out with Puppeteer still holding the
 * browser. Nulls the shared refs synchronously so subsequent getBrowser calls
 * launch fresh; fires close() without awaiting so a hung Chrome doesn't block
 * us. activeUsers is deliberately left alone — it counts outstanding
 * withBrowserAndPage invocations and drains naturally when the zombie unwinds.
 */
export function forceResetBrowser() {
	const browser = sharedBrowser;
	sharedBrowser = null;
	launchPromise = null;
	if (!browser) return;
	logger.warn('Force-resetting shared browser after scrape timeout');
	browser.close().catch((error) => {
		logger.debug('Error during forced browser close', error);
	});
}

export async function withBrowserAndPage<T>(
	options: BrowserOptions,
	callback: (browser: Browser, page: Page) => Promise<T>
): Promise<T> {
	const browser = await getBrowser(options);
	try {
		const page = await browser.newPage();
		try {
			return await callback(browser, page);
		} finally {
			await closePageSafely(page);
		}
	} finally {
		await disposeBrowser();
	}
}

async function closePageSafely(page: Page) {
	try {
		await page.close();
	} catch (error) {
		logger.debug('Error closing page', error);
	}
}
