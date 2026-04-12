import puppeteerCore, { Page, type Browser, type LaunchOptions } from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { createLogger } from '../logger';

const logger = createLogger('scrapeBlazor:getBrowser');

const remoteExecutablePath =
	'https://github.com/Sparticuz/chromium/releases/download/v147.0.0/chromium-v147.0.0-pack.x64.tar';

const useSystemChrome = process.env.NODE_ENV !== 'production';
let sharedBrowser: Browser | null = null;

type BrowserOptions = Pick<LaunchOptions, 'defaultViewport' | 'headless'>;

export async function getBrowser(options?: BrowserOptions) {
	if (!sharedBrowser?.connected) {
		logger.debug('Creating new browser instance', { useSystemChrome });

		const baseArgs = ['--locale=en-US', '--accept-lang=en-US'];

		sharedBrowser = await puppeteerCore.launch({
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
		});
	}

	return sharedBrowser;
}

export async function disposeBrowser() {
	if (!sharedBrowser) {
		return;
	}

	// const pages = await sharedBrowser.pages();
	// for (const page of pages) {
	// 	await page.close();
	// }

	if (useSystemChrome) {
		await sharedBrowser.close();
	}
}

type Callback<T, TInstance> = (callback: (instance: TInstance) => Promise<T>) => Promise<T>;

export function withBrowser<T>(options?: BrowserOptions): Callback<T, Browser> {
	return async (callback) => {
		const browser = await getBrowser(options);

		try {
			return await callback(browser);
		} finally {
			await disposeBrowser();
		}
	};
}

export async function withPage<T>(
	browser: Browser,
	callback: (page: Page) => Promise<T>
): Promise<T> {
	const page = await browser.newPage();
	try {
		return await callback(page);
	} finally {
		await page.close();
	}
}

export async function withBrowserAndPage<T>(
	options: BrowserOptions,
	callback: (browser: Browser, page: Page) => Promise<T>
): Promise<T> {
	const browser = await getBrowser(options);
	const page = await browser.newPage();

	try {
		return await callback(browser, page);
	} finally {
		await page.close();
		await disposeBrowser();
	}
}
