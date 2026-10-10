import type { Page } from 'puppeteer-core';

/**
 * The site covers the page with a jQuery blockUI overlay while Blazor is
 * busy, e.g. for ~0.7-0.9s after search results render. Real mouse clicks
 * made meanwhile hit the overlay and do nothing, with no error. Wait for it
 * to be gone before interacting.
 */
const blockOverlaySelector = '.blockUI.blockOverlay';

export async function waitForUnblocked(page: Page, timeout = 5000): Promise<void> {
	await page.waitForFunction(
		(selector: string) =>
			Array.from(document.querySelectorAll(selector)).every(
				(el) => getComputedStyle(el).display === 'none' || el.getClientRects().length === 0
			),
		{ timeout, polling: 30 },
		blockOverlaySelector
	);
}
