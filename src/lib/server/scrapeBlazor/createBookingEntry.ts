import type { Booking } from '$lib/types';
import type { SetOptional } from 'type-fest';
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

export function getResourceIdFromIndex(index: string | undefined): string {
	switch (index) {
		case '1':
			return halfCourtAId;

		case '2':
			return halfCourtBId;

		default:
			return fullCourtId;
	}
}
