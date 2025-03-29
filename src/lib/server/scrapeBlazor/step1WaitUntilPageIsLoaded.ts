import type { Page } from 'puppeteer-core';
import { waitForElementWithText } from './waitFor';
import { getElementsTexts, getElementWithText } from './getElementWithText';
import { selectors, texts } from './selectorsAndTexts';

export async function waitUntilPageIsLoaded(page: Page) {
	await waitForMenuItems(page);
	await waitForSearchInput(page);
}

async function waitForMenuItems(page: Page) {
	console.log('Waiting for menu items...');
	try {
		await waitForElementWithText(page, selectors.menuItem, texts.menuItem);
	} catch (error) {
		console.log('waitForElementWithText timed out. Could not find menu items');
		const menuItemsText = await getElementsTexts(await page.$$(selectors.menuItem));
		console.log('Menu items:', menuItemsText);
		throw error;
	}
	console.log('Menu items found');
	const menuItemsText = await getElementsTexts(await page.$$(selectors.menuItem));
	console.log('Menu items:', menuItemsText);
}

async function waitForSearchInput(page: Page) {
	console.log('Waiting for search input...');
	const searchInput = await page.waitForSelector(selectors.searchInput);
	if (!searchInput) {
		throw new Error('Search input not found');
	}
	console.log('Search input found');
}
