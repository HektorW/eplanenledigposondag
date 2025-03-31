import type { ElementHandle, NodeFor, Page } from 'puppeteer-core';

type PromiseOrValue<T> = Promise<T> | T;

export async function withElements<
	TElement extends Element,
	TAll extends ElementHandle<TElement>[] | ElementHandle<TElement> | null,
	TReturn
>(elementOrElementList: PromiseOrValue<TAll>, callback: (element: TAll) => Promise<TReturn>) {
	const resolvedElementOrElementList = await elementOrElementList;

	const result = await callback(resolvedElementOrElementList);

	if (Array.isArray(resolvedElementOrElementList)) {
		resolvedElementOrElementList.forEach((element) => element.dispose());
	} else if (resolvedElementOrElementList) {
		resolvedElementOrElementList.dispose();
	}

	return result;
}

export async function withSelector<TSelector extends string, TReturn>(
	page: Page,
	selector: TSelector,
	callback: (element: ElementHandle<NodeFor<TSelector>> | null) => Promise<TReturn>
) {
	return withElements(page.waitForSelector(selector), callback);
}

export async function with$$<Selector extends string, TReturn>(
	page: Page,
	selector: Selector,
	callback: (elements: ElementHandle<NodeFor<Selector>>[]) => Promise<TReturn>
) {
	return withElements(page.$$(selector), callback);
}
