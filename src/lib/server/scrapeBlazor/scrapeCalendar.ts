import { attempt, isFail } from '$lib/attempt';
import type { CalendarResponse } from '$lib/types';
import puppeteer, { ElementHandle, type NodeFor, type Page } from 'puppeteer';

const baseUrl = 'https://malmo.rbok.se/boka-resurser';

const emptyResponse: CalendarResponse = {
	Data: [],
	Total: 0,
	AggregateResults: null,
	Errors: null
};

export async function scrapeCalendar(targetDate: Date): Promise<CalendarResponse> {
	console.log('Scraping calendar...');
	console.log('Target date:', targetDate.toISOString());

	const browser = await puppeteer.launch({
		headless: true,
		defaultViewport: { width: 1080, height: 1024 }
	});
	const page = await browser.newPage();

	console.log('Navigating to URL:', baseUrl);

	await page.goto(`${baseUrl}`);

	// console.log('Waiting for the calendar page to load...');
	// await page.waitForSelector('[aria-label="Book"] [href="/boka-resurser"]');

	console.log('Waiting for the search input...');
	const searchInput = await page.waitForSelector('#main input[placeholder="-- search --"]');

	if (!searchInput) {
		console.log('Could not find search input');
		await browser.close();
		return emptyResponse;
	}

	console.log('Found search input');
	const searchInputPlaceholder = await searchInput.evaluate((el) => el.getAttribute('placeholder'));
	console.log('Search input placeholder:', searchInputPlaceholder);

	await searchInput.type('sorgenfri');
	await searchInput.press('Enter');

	const inputValue = await searchInput.evaluate((el) => el.value);
	console.log('Typed value:', inputValue);

	const sorgenfriLabels = await waitForSorgenfriLabels(page);

	if (!sorgenfriLabels) {
		console.log('Could not find Sorgenfri labels');
		await browser.close();
		return emptyResponse;
	}

	// console.log('Selecting Sorgenfri labels');
	// for (const label of sorgenfriLabels) {
	// 	const clickResult = await attempt(() => label.click());
	// 	if (isFail(clickResult)) {
	// 		console.log('Error clicking label:', clickResult.error);
	// 		console.log('Label text:', await label.evaluate((el) => el.textContent));
	// 		await browser.close();
	// 		return emptyResponse;
	// 	}
	// }
	// console.log('Sorgenfri labels selected');

	// const dayBtn = await getElementWithText(page, '.k-toolbar .k-button-group button', 'Day');
	// if (!dayBtn) {
	// 	console.log('Could not find day button');
	// 	await browser.close();
	// 	return emptyResponse;
	// }

	// dayBtn.click();

	// const selectDateResult = await attempt(() => selectTargetDate(page, targetDate));
	// if (isFail(selectDateResult)) {
	// 	console.log('Error selecting target date:', selectDateResult.error);
	// 	await browser.close();
	// 	return emptyResponse;
	// }

	// console.log('Target date selected');

	// await page.screenshot({
	// 	path: `screenshot-${targetDate.toISOString().split('T')[0]}.png`
	// });

	// console.log('Saved screenshot');

	const title = await page.title();

	await browser.close();

	console.log('Browser closed, returning calendar response');

	return {
		Data: [
			{
				Title: title
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

async function getAllElementsWithText<Selector extends string>(
	page: Page,
	selector: Selector,
	text: string
): Promise<ElementHandle<NodeFor<Selector>>[]> {
	const elements = await page.$$(selector);
	const matchingElements = [];

	for (const element of elements) {
		const elementText = await element.evaluate((el) => el.textContent);
		if (elementText?.includes(text)) {
			matchingElements.push(element);
		}
	}

	return matchingElements;
}

async function getElementWithText<Selector extends string>(
	page: Page,
	selector: Selector,
	text: string
): Promise<ElementHandle<NodeFor<Selector>> | null> {
	return (await getAllElementsWithText(page, selector, text))[0] ?? null;
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
