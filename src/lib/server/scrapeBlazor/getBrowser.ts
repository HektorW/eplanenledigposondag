import puppeteerCore, { type Browser, type LaunchOptions } from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';

const remoteExecutablePath =
	'https://github.com/Sparticuz/chromium/releases/download/v121.0.0/chromium-v121.0.0-pack.tar';

const isLocal = process.env.NODE_ENV === 'development';
let sharedBrowser: Browser | null = null;

export async function getBrowser(options?: Pick<LaunchOptions, 'defaultViewport' | 'headless'>) {
	if (!sharedBrowser?.connected) {
		console.log('Creating new browser instance', { isLocal });

		const baseArgs = ['--locale=sv-SE', '--accept-lang=sv-SE'];

		sharedBrowser = await puppeteerCore.launch({
			...options,
			...(isLocal
				? {
						channel: 'chrome',
						args: baseArgs,
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

	if (isLocal) {
		await sharedBrowser.close();
	}
}
