import { assertNonNullish } from '$lib/assert';
import type { Page } from 'puppeteer-core';

export async function selectTargetDate(
	page: Page,
	targetDate: Date,
	retryCount = 0
): Promise<void> {
	if (retryCount > 10) {
		throw new Error('Max retries reached while selecting target date');
	}

	const month = targetDate.getMonth() + 1;
	const day = targetDate.getDate();

	const prefix = (n: number) => (n < 10 ? '0' + n : n);
	const targetDateStr = `Sun ${prefix(day)}/${prefix(month)}`;

	const element = await page.waitForSelector('.k-link.k-nav-day');
	assertNonNullish(element, 'Date element not found');

	const elementText = await element.evaluate((el) => el.textContent);
	assertNonNullish(elementText, 'Element text not found');

	if (!elementText.includes(targetDateStr)) {
		console.log('Target day not found, selecting next day...', {
			targetDateStr,
			elementText
		});
		await selectNextDay(page);
		await new Promise((resolve) => setTimeout(resolve, 100));
		return selectTargetDate(page, targetDate, retryCount + 1);
	}

	console.log('Found target day:', elementText);
}

async function selectNextDay(page: Page): Promise<void> {
	const nextBtn = await page.waitForSelector('.k-toolbar button[aria-label="Next"]');
	if (!nextBtn) {
		throw new Error('Could not find next button');
	}

	await nextBtn.click();
}
