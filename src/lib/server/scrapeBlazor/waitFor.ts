import type { ElementHandle, NodeFor, Page } from 'puppeteer-core';
import { getElementWithText } from './getElementWithText';

type WaitForOptions = {
	maxTime?: number;
	pollInterval?: number;
	errorMessage?: string;
};

export async function waitFor<T>(
	pollFunction: () => Promise<T | null>,
	options: WaitForOptions = {}
) {
	const { maxTime = 2000, pollInterval = 100 } = options;

	const startTime = Date.now();

	while (Date.now() - startTime < maxTime) {
		const result = await pollFunction();

		if (result) {
			return result;
		}

		await new Promise((resolve) => setTimeout(resolve, pollInterval));
	}

	throw new Error(options.errorMessage ?? `waitFor: Timeout after ${maxTime}ms while waiting.`);
}

export async function waitForElementWithText<Selector extends string>(
	page: Page,
	selector: Selector,
	text: string,
	options?: WaitForOptions
): Promise<ElementHandle<NodeFor<Selector>> | null> {
	return await waitFor(() => getElementWithText(page, selector, text), {
		errorMessage: `waitForElementWithText: Timeout while waiting for element
  selector: "${selector}"
  text: "${text}"`,
		...options
	});
}
