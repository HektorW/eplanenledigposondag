import { Temporal } from '@js-temporal/polyfill';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Max days into the future that the scraper can navigate to.
 * Coupled to the retry limit in step4SelectTargetDate — the scraper
 * clicks "Next" one day at a time, so it can't reach further than this.
 */
export const MAX_FUTURE_DAYS = 10;

export type ParseTargetDateResult = {
	date: Date;
	usedFallback: boolean;
};

export function dateToPlainDate(date: Date): Temporal.PlainDate {
	return Temporal.PlainDate.from({
		year: date.getFullYear(),
		month: date.getMonth() + 1,
		day: date.getDate()
	});
}

export function plainDateToDate(plainDate: Temporal.PlainDate): Date {
	return new Date(plainDate.year, plainDate.month - 1, plainDate.day);
}

export function canStepToPrevDay(date: Date, now = new Date()): boolean {
	const prev = dateToPlainDate(date).subtract({ days: 1 });
	const today = dateToPlainDate(now);
	return Temporal.PlainDate.compare(prev, today) >= 0;
}

export function canStepToNextDay(date: Date, now = new Date()): boolean {
	const today = dateToPlainDate(now);
	const next = dateToPlainDate(date).add({ days: 1 });
	const maxDate = today.add({ days: MAX_FUTURE_DAYS });
	return Temporal.PlainDate.compare(next, maxDate) <= 0;
}

/**
 * Parses a date query parameter string into a Date.
 * Returns the default (next Sunday) if the param is missing or invalid.
 * Rejects dates in the past or more than MAX_FUTURE_DAYS from today.
 */
export function parseTargetDate(dateParam: string | null, now = new Date()): ParseTargetDateResult {
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

	const today = dateToPlainDate(now);
	const maxDate = today.add({ days: MAX_FUTURE_DAYS });

	if (
		Temporal.PlainDate.compare(plainDate, today) < 0 ||
		Temporal.PlainDate.compare(plainDate, maxDate) > 0
	) {
		return { date: getNextSundayDate(now), usedFallback: true };
	}

	return { date: plainDateToDate(plainDate), usedFallback: false };
}

export function print24HourTime(minutes: number): string {
	const rounded = Math.round(minutes);
	const hours = Math.floor(rounded / 60);
	const mins = rounded % 60;
	return `${hours}:${String(mins).padStart(2, '0')}`;
}

export function getNextSundayDate(fromDate = new Date()) {
	const nextSunday = new Date(fromDate);

	const sundayDayIndex = 0;
	const nextSundayAtHour = 22;
	if (fromDate.getDay() !== sundayDayIndex || fromDate.getHours() >= nextSundayAtHour) {
		nextSunday.setDate(fromDate.getDate() + (7 - fromDate.getDay()));
	}

	return nextSunday;
}

export function formattedTimeToMinutes(time: string): number {
	const [hours, minutes] = time.split(':').map(Number);
	return Math.round(hours * 60 + minutes);
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
