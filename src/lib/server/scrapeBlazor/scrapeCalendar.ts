import { attempt, isFail } from '$lib/attempt';
import type { CalendarResponse } from '$lib/types';
import type { ElementHandle, Page } from 'puppeteer-core';
import { disposeBrowser, getBrowser } from './getBrowser';
import { waitForElementWithText } from './waitFor';
import { getAllElementsWithText, getElementWithText } from './getElementWithText';

const baseUrl = 'https://malmo.rbok.se/boka-resurser';

const emptyResponse: CalendarResponse = {
	Data: [],
	Total: 0,
	AggregateResults: null,
	Errors: null
};

export async function scrapeCalendar(targetDate: Date): Promise<CalendarResponse> {
	console.log('Scraping blazor calendar...');
	console.log('Target date:', targetDate.toISOString());

	const browser = await getBrowser({
		defaultViewport: { width: 1080, height: 1024 },
		headless: true
	});

	let title: string | null = null;

	try {
		const page = await browser.newPage();

		console.log('Navigating to URL:', baseUrl);
		await page.goto(`${baseUrl}`, { waitUntil: 'domcontentloaded' });

		title = await page.title();
		console.log('Page title:', title);

		const elementOnLaunch = await getElementWithText(page, 'a.rbok-menu-sub-item', 'Resources');
		console.log('Had menu items on launch:', elementOnLaunch !== null);

		console.log('Waiting for menu items...');
		try {
			await waitForElementWithText(page, 'a.rbok-menu-sub-item', 'Resources');
		} catch (error) {
			console.log('waitForElementWithText timed out. Could not find menu items');
			const menuItems = await page.$$('a.rbok-menu-sub-item');
			const menuItemsText = await Promise.all(
				menuItems.map(async (item) => {
					const text = await item.evaluate((el) => el.textContent);
					return text?.trim() ?? '';
				})
			);
			console.log('Menu items:', menuItemsText);

			throw error;
		}
		console.log('Menu items found');

		console.log('Waiting for the search input...');
		const searchInput = await page.waitForSelector('#main input[placeholder="-- search --"]');
		console.log('Search input found:', searchInput !== null);

		// await searchInput.type('sorgenfri');
	} finally {
		await disposeBrowser();
	}

	// if (!searchInput) {
	// 	console.log('Could not find search input');
	// 	await disposeBrowser();
	// 	return emptyResponse;
	// }

	// console.log('Found search input');
	// const searchInputPlaceholder = await searchInput.evaluate((el) => el.getAttribute('placeholder'));
	// console.log('Search input placeholder:', searchInputPlaceholder);

	// await searchInput.type('sorgenfri');
	// await searchInput.press('Enter');

	// const inputValue = await searchInput.evaluate((el) => el.value);
	// console.log('Typed value:', inputValue);

	// const sorgenfriLabels = await waitForSorgenfriLabels(page);

	// if (!sorgenfriLabels) {
	// 	console.log('Could not find Sorgenfri labels');
	// 	await disposeBrowser();
	// 	return emptyResponse;
	// }

	// // console.log('Selecting Sorgenfri labels');
	// // for (const label of sorgenfriLabels) {
	// // 	const clickResult = await attempt(() => label.click());
	// // 	if (isFail(clickResult)) {
	// // 		console.log('Error clicking label:', clickResult.error);
	// // 		console.log('Label text:', await label.evaluate((el) => el.textContent));
	// // 		await disposeBrowser()
	// // 		return emptyResponse;
	// // 	}
	// // }
	// // console.log('Sorgenfri labels selected');

	// // const dayBtn = await getElementWithText(page, '.k-toolbar .k-button-group button', 'Day');
	// // if (!dayBtn) {
	// // 	console.log('Could not find day button');
	// // 	await disposeBrowser()
	// // 	return emptyResponse;
	// // }

	// // dayBtn.click();

	// // const selectDateResult = await attempt(() => selectTargetDate(page, targetDate));
	// // if (isFail(selectDateResult)) {
	// // 	console.log('Error selecting target date:', selectDateResult.error);
	// // 	await disposeBrowser()
	// // 	return emptyResponse;
	// // }

	// // console.log('Target date selected');

	// // await page.screenshot({
	// // 	path: `screenshot-${targetDate.toISOString().split('T')[0]}.png`
	// // });

	// // console.log('Saved screenshot');

	// const title = await page.title();

	// await disposeBrowser();

	// console.log('Browser closed, returning calendar response');

	return {
		Data: [
			{
				Title: title ?? 'Unknown'
			} as any
		],
		Total: 0,
		AggregateResults: null,
		Errors: null
	};
}

async function waitForSorgenfriLabels(
	page: Page,
	firstCallTs = Date.now()
): Promise<ElementHandle<HTMLLabelElement>[] | null> {
	const maxWaitTime = 1000;
	const currentTs = Date.now();
	const elapsedTime = currentTs - firstCallTs;
	if (elapsedTime > maxWaitTime) {
		console.log('Max wait time exceeded');
		return null;
	}

	console.log('Looking for Sorgenfri labels...');

	const sorgenfriLabels = await getSorgenfriLabels(page);

	const expectedLabelCount = 3;
	if (sorgenfriLabels.length >= expectedLabelCount) {
		console.log('Found all Sorgenfri labels');
		return sorgenfriLabels;
	}

	console.log('Sorgenfri labels not found, waiting 100ms...');
	await new Promise((resolve) => setTimeout(resolve, 100));

	return await waitForSorgenfriLabels(page, firstCallTs);
}

async function getSorgenfriLabels(page: Page): Promise<ElementHandle<HTMLLabelElement>[]> {
	return await getAllElementsWithText(page, '#Resurser label', 'Sorgenfri IP');
}

async function selectTargetDate(page: Page, targetDate: Date): Promise<void> {
	const month = targetDate.getMonth() + 1;
	const day = targetDate.getDate();

	const prefix = (n: number) => (n < 10 ? '0' + n : n);
	const targetDateStr = `Sun ${prefix(day)} ${prefix(month)}`;

	const element = await page.waitForSelector('.k-link.k-nav-day');
	if (!element) {
		throw new Error('Could not find date element');
	}

	const elementText = await element.evaluate((el) => el.textContent);
	if (!elementText) {
		throw new Error('Could not get date element text');
	}

	if (!elementText.includes(targetDateStr)) {
		console.log('Target date not found, selecting next day...');
		await selectNextDay(page);
		return selectTargetDate(page, targetDate);
	}

	console.log('Found target date:', elementText);
}

async function selectNextDay(page: Page): Promise<void> {
	const nextBtn = await page.waitForSelector('.k-toolbar button[aria-label="Next"]');
	if (!nextBtn) {
		throw new Error('Could not find next button');
	}

	await nextBtn.click();
}
