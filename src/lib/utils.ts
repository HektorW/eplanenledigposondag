import { Temporal } from '@js-temporal/polyfill';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The app serves a single region (Malmö). Pin all "now" lookups to this
 * timezone so server-side date math stays correct regardless of host TZ.
 */
export const APP_TIME_ZONE = 'Europe/Stockholm';

export function todayInAppTz(): Temporal.PlainDate {
	return Temporal.Now.plainDateISO(APP_TIME_ZONE);
}

export function nowInAppTz(): Temporal.PlainDateTime {
	return Temporal.Now.plainDateTimeISO(APP_TIME_ZONE);
}

/**
 * Max days into the future that the scraper can navigate to.
 * Coupled to the retry limit in step4SelectTargetDate — the scraper
 * clicks "Next" one day at a time, so it can't reach further than this.
 */
export const MAX_FUTURE_DAYS = 10;

export type ParseTargetDateResult = {
	date: Temporal.PlainDate;
	usedFallback: boolean;
};

export function canStepToPrevDay(date: Temporal.PlainDate, today = todayInAppTz()): boolean {
	const prev = date.subtract({ days: 1 });
	return Temporal.PlainDate.compare(prev, today) >= 0;
}

export function canStepToNextDay(date: Temporal.PlainDate, today = todayInAppTz()): boolean {
	const next = date.add({ days: 1 });
	const maxDate = today.add({ days: MAX_FUTURE_DAYS });
	return Temporal.PlainDate.compare(next, maxDate) <= 0;
}

/**
 * Parses a date query parameter string into a PlainDate.
 * Returns the default (next Sunday) if the param is missing or invalid.
 * Rejects dates in the past or more than MAX_FUTURE_DAYS from today.
 */
export function parseTargetDate(
	dateParam: string | null,
	now: Temporal.PlainDateTime = nowInAppTz()
): ParseTargetDateResult {
	const today = now.toPlainDate();

	if (!dateParam) {
		return { date: getNextSundayDate(now), usedFallback: false };
	}

	if (!isoDateRegex.test(dateParam)) {
		return { date: getNextSundayDate(now), usedFallback: true };
	}

	let plainDate: Temporal.PlainDate;
	try {
		plainDate = Temporal.PlainDate.from(dateParam, { overflow: 'reject' });
	} catch {
		return { date: getNextSundayDate(now), usedFallback: true };
	}

	const maxDate = today.add({ days: MAX_FUTURE_DAYS });

	if (
		Temporal.PlainDate.compare(plainDate, today) < 0 ||
		Temporal.PlainDate.compare(plainDate, maxDate) > 0
	) {
		return { date: getNextSundayDate(now), usedFallback: true };
	}

	return { date: plainDate, usedFallback: false };
}

export function print24HourTime(minutes: number): string {
	const rounded = Math.round(minutes);
	const hours = Math.floor(rounded / 60);
	const mins = rounded % 60;
	return `${hours}:${String(mins).padStart(2, '0')}`;
}

const SUNDAY = 7; // ISO day-of-week
const NEXT_SUNDAY_AT_HOUR = 22;

export function getNextSundayDate(from: Temporal.PlainDateTime = nowInAppTz()): Temporal.PlainDate {
	const today = from.toPlainDate();

	if (today.dayOfWeek === SUNDAY && from.hour < NEXT_SUNDAY_AT_HOUR) {
		return today;
	}

	const daysUntilSunday = ((SUNDAY - today.dayOfWeek + 6) % 7) + 1;
	return today.add({ days: daysUntilSunday });
}

export function formattedTimeToMinutes(time: string): number {
	const [hours, minutes] = time.split(':').map(Number);
	return Math.round(hours * 60 + minutes);
}

const WEEKDAY_NAME: Record<number, string> = {
	1: 'Måndag',
	2: 'Tisdag',
	3: 'Onsdag',
	4: 'Torsdag',
	5: 'Fredag',
	6: 'Lördag',
	7: 'Söndag'
};

export function getBollTitle(date: Temporal.PlainDate): string {
	return `${WEEKDAY_NAME[date.dayOfWeek]}sboll ⚽️`;
}

export function formatScrapedAt(isoString: string): string {
	const date = new Date(isoString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMin = Math.floor(diffMs / 60000);

	if (diffMin < 1) return 'just nu';
	if (diffMin === 1) return '1 minut sedan';
	if (diffMin < 60) return `${diffMin} minuter sedan`;

	const diffHours = Math.floor(diffMin / 60);
	if (diffHours < 24) {
		if (diffHours === 1) return '1 timme sedan';
		return `${diffHours} timmar sedan`;
	}

	const diffDays = Math.floor(diffHours / 24);
	if (diffDays === 1) return '1 dag sedan';
	return `${diffDays} dagar sedan`;
}
