import { attempt, isFail } from '$lib/attempt';
import type { CalendarResponse } from '$lib/types';
import type { ElementHandle, Page } from 'puppeteer-core';
import { disposeBrowser, getBrowser } from './getBrowser';
import { waitForElementWithText } from './waitFor';
import { getAllElementsWithText, getElementWithText } from './getElementWithText';
import { waitUntilPageIsLoaded } from './step1WaitUntilPageIsLoaded';
import { searchForSorgenfri } from './step2SearchForSorgenfri';
import { selectDayView } from './step3SelectDayView';
import { selectTargetDate } from './step4SelectTargetDate';

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
		defaultViewport: { width: 1200, height: 1024 },
		headless: false
	});

	let title: string | null = null;

	try {
		const page = await browser.newPage();

		// const client = await page.createCDPSession();
		// await client.send('Network.enable');

		// client.on('Network.webSocketCreated', ({ requestId, url }) => {
		// 	console.log('Network.webSocketCreated', requestId, url);
		// });

		// client.on('Network.webSocketFrameReceived', ({ requestId, timestamp, response }) => {
		// 	console.log('Network.webSocketFrameReceived', requestId, timestamp, response.payloadData);
		// });

		console.log('Navigating to URL:', baseUrl);
		await page.goto(`${baseUrl}`, { waitUntil: 'networkidle2' });

		title = await page.title();
		console.log('Page title:', title);

		// await new Promise((resolve) => {
		// 	page.wait
		// })

		await waitUntilPageIsLoaded(page);
		await searchForSorgenfri(page);
		await selectDayView(page);
		// await selectTargetDate(page, targetDate);

		await new Promise((resolve) => setTimeout(resolve, 5000));

		await page.screenshot({
			path: `screenshot-${targetDate.toISOString().split('T')[0]}.png`
		});

		console.log('Saved screenshot');
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
