import { assertNonNullish } from '$lib/assert';
import type { Booking } from '$lib/types';
import type { ElementHandle } from 'puppeteer-core';
import type { SetOptional } from 'type-fest';
import { resourceAndDateRegex } from './constants';
import { fullCourtId, halfCourtAId, halfCourtBId } from '$lib/ids';

export function createBookingEntry({
	bookingId,
	resourceId,

	startTimeFormatted,
	endTimeFormatted,

	bookedBy,
	additionalInfo
}: SetOptional<Booking, 'bookingId'>): Booking {
	return {
		bookingId: bookingId ?? crypto.randomUUID(),
		resourceId: resourceId,

		startTimeFormatted,
		endTimeFormatted,

		bookedBy,
		additionalInfo: additionalInfo ?? null
	};
}

export async function createBookingEntryFromEventElement(element: ElementHandle<Element>) {
	const ariaLabel = await element.evaluate((el) => el.getAttribute('aria-label'));
	assertNonNullish(ariaLabel, 'aria-label not found on event element');

	const match = ariaLabel.match(resourceAndDateRegex);
	assertNonNullish(match, 'Failed to match resource and date from aria-label');

	const maybeResourceIndex: string | undefined = match[1];

	const allTextElements = await element.$$('.text-truncate');
	assertNonNullish(allTextElements, 'Failed to find text elements in event element');

	const timeElement = allTextElements[0];
	assertNonNullish(timeElement, 'Failed to find time element in event element');
	const timeText = await timeElement.evaluate((el) => el.textContent);
	assertNonNullish(timeText, 'Failed to get time text from time element');
	const [startTimeFormatted, endTimeFormatted] = timeText.trim().split('-');

	const bookedByElement = allTextElements[1];
	assertNonNullish(bookedByElement, 'Failed to find booked by element in event element');
	const bookedBy = await bookedByElement.evaluate((el) => el.textContent);
	assertNonNullish(bookedBy, 'Failed to get booked by text from booked by element');

	const additionalInfoElement = allTextElements[2];
	const additionalInfo = (await additionalInfoElement?.evaluate((el) => el.textContent)) ?? null;

	return createBookingEntry({
		resourceId: getResourceIdFromIndex(maybeResourceIndex),

		startTimeFormatted,
		endTimeFormatted,

		bookedBy,
		additionalInfo
	});
}

function getResourceIdFromIndex(index: string | undefined): string {
	switch (index) {
		case '1':
			return halfCourtAId;

		case '2':
			return halfCourtBId;

		default:
			return fullCourtId;
	}
}
