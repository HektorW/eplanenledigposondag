import type { ElementHandle, NodeFor, Page } from 'puppeteer-core';

export async function getAllElementsWithText<Selector extends string>(
	page: Page,
	selector: Selector,
	text: string
): Promise<ElementHandle<NodeFor<Selector>>[]> {
	const elements = await page.$$(selector);
	return filterElementsWithText(elements, text);
}

export async function filterElementsWithText<TElement extends Element>(
	elements: ElementHandle<TElement>[],
	text: string
): Promise<ElementHandle<TElement>[]> {
	const matchingElements = [];

	for (const element of elements) {
		const elementText = await element.evaluate((el) => el.textContent);
		if (elementText?.includes(text)) {
			matchingElements.push(element);
		}
	}

	return matchingElements;
}

export async function getElementWithText<Selector extends string>(
	page: Page,
	selector: Selector,
	text: string
): Promise<ElementHandle<NodeFor<Selector>> | null> {
	return (await getAllElementsWithText(page, selector, text))[0] ?? null;
}

export async function getElementsTexts(elements: ElementHandle<Element>[]): Promise<string[]> {
	const texts = await Promise.all(
		elements.map(async (element) => {
			const text = await element.evaluate((el) => el.textContent);
			return text ?? '';
		})
	);
	return texts;
}
