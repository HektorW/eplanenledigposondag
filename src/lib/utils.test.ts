import { describe, it, expect, vi, afterEach } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import {
	print24HourTime,
	getNextSundayDate,
	parseTargetDate,
	formattedTimeToMinutes,
	canStepToPrevDay,
	canStepToNextDay,
	getBollTitle,
	MAX_FUTURE_DAYS,
	formatScrapedAt
} from './utils';

describe('print24HourTime', () => {
	it('formats 0 minutes as 0:00', () => {
		expect(print24HourTime(0)).toBe('0:00');
	});

	it('formats full hours correctly', () => {
		expect(print24HourTime(60)).toBe('1:00');
		expect(print24HourTime(720)).toBe('12:00');
		expect(print24HourTime(1380)).toBe('23:00');
	});

	it('formats hours with minutes correctly', () => {
		expect(print24HourTime(90)).toBe('1:30');
		expect(print24HourTime(750)).toBe('12:30');
	});

	it('rounds fractional minutes up across the hour boundary', () => {
		// 119.5 rounds to 120 -> 2:00, not 1:00
		expect(print24HourTime(119.5)).toBe('2:00');
		// 59.5 rounds to 60 -> 1:00, not 0:00
		expect(print24HourTime(59.5)).toBe('1:00');
	});
});

describe('getNextSundayDate', () => {
	it('returns next Sunday from a Wednesday', () => {
		// 2025-01-08 is a Wednesday
		const wednesday = Temporal.PlainDateTime.from('2025-01-08T12:00:00');
		const result = getNextSundayDate(wednesday);
		expect(result.dayOfWeek).toBe(7); // Sunday
		expect(result.day).toBe(12);
	});

	it('returns same Sunday if before 22:00', () => {
		// 2025-01-12 is a Sunday
		const sundayMorning = Temporal.PlainDateTime.from('2025-01-12T10:00:00');
		const result = getNextSundayDate(sundayMorning);
		expect(result.dayOfWeek).toBe(7);
		expect(result.day).toBe(12);
	});

	it('returns next Sunday if Sunday at or after 22:00', () => {
		// 2025-01-12 is a Sunday at 22:00
		const sundayEvening = Temporal.PlainDateTime.from('2025-01-12T22:00:00');
		const result = getNextSundayDate(sundayEvening);
		expect(result.dayOfWeek).toBe(7);
		expect(result.day).toBe(19);
	});

	it('returns next day from a Saturday', () => {
		// 2025-01-11 is a Saturday
		const saturday = Temporal.PlainDateTime.from('2025-01-11T12:00:00');
		const result = getNextSundayDate(saturday);
		expect(result.dayOfWeek).toBe(7);
		expect(result.day).toBe(12);
	});
});

describe('parseTargetDate', () => {
	// 2026-04-13 is a Monday
	const now = Temporal.PlainDateTime.from('2026-04-13T12:00:00');

	it('returns next Sunday with usedFallback false when param is null', () => {
		const result = parseTargetDate(null, now);
		expect(result.usedFallback).toBe(false);
		expect(result.date.dayOfWeek).toBe(7); // Sunday
	});

	it('parses a valid ISO date within range', () => {
		const result = parseTargetDate('2026-04-15', now);
		expect(result.usedFallback).toBe(false);
		expect(result.date.year).toBe(2026);
		expect(result.date.month).toBe(4);
		expect(result.date.day).toBe(15);
	});

	it('accepts today', () => {
		const result = parseTargetDate('2026-04-13', now);
		expect(result.usedFallback).toBe(false);
		expect(result.date.day).toBe(13);
	});

	it('accepts the last day within range', () => {
		const result = parseTargetDate('2026-04-23', now);
		expect(result.usedFallback).toBe(false);
		expect(result.date.day).toBe(23);
	});

	it('falls back on empty string', () => {
		const result = parseTargetDate('', now);
		expect(result.usedFallback).toBe(false);
		expect(result.date.dayOfWeek).toBe(7);
	});

	it('falls back on invalid format', () => {
		const result = parseTargetDate('not-a-date', now);
		expect(result.usedFallback).toBe(true);
	});

	it('falls back on partial date', () => {
		const result = parseTargetDate('2026-04', now);
		expect(result.usedFallback).toBe(true);
	});

	it('falls back on date with extra characters', () => {
		const result = parseTargetDate('2026-04-15T00:00:00', now);
		expect(result.usedFallback).toBe(true);
	});

	it('falls back on nonsense date like Feb 30', () => {
		const result = parseTargetDate('2026-02-30', now);
		expect(result.usedFallback).toBe(true);
	});

	it('falls back on month 13', () => {
		const result = parseTargetDate('2026-13-01', now);
		expect(result.usedFallback).toBe(true);
	});

	it('accepts leap day on a leap year within range', () => {
		const leapNow = Temporal.PlainDateTime.from('2028-02-25T12:00:00');
		const result = parseTargetDate('2028-02-29', leapNow);
		expect(result.usedFallback).toBe(false);
		expect(result.date.month).toBe(2);
		expect(result.date.day).toBe(29);
	});

	it('falls back on Feb 29 in a non-leap year', () => {
		const result = parseTargetDate('2026-02-29', now);
		expect(result.usedFallback).toBe(true);
	});

	it('falls back on date in the past', () => {
		const result = parseTargetDate('2026-04-12', now);
		expect(result.usedFallback).toBe(true);
	});

	it('falls back on date too far in the future', () => {
		const result = parseTargetDate('2026-04-24', now);
		expect(result.usedFallback).toBe(true);
	});
});

describe('canStepToPrevDay', () => {
	// 2026-04-13 is a Monday
	const today = Temporal.PlainDate.from('2026-04-13');

	it('allows stepping back when target is after today', () => {
		expect(canStepToPrevDay(Temporal.PlainDate.from('2026-04-15'), today)).toBe(true);
	});

	it('allows stepping back when target is tomorrow (prev lands on today)', () => {
		expect(canStepToPrevDay(Temporal.PlainDate.from('2026-04-14'), today)).toBe(true);
	});

	it('disallows stepping back when target is today (prev would land before today)', () => {
		expect(canStepToPrevDay(Temporal.PlainDate.from('2026-04-13'), today)).toBe(false);
	});
});

describe('canStepToNextDay', () => {
	// 2026-04-13 is a Monday; max future = today + MAX_FUTURE_DAYS
	const today = Temporal.PlainDate.from('2026-04-13');
	const maxDate = today.add({ days: MAX_FUTURE_DAYS });

	it('allows stepping forward within range', () => {
		expect(canStepToNextDay(today, today)).toBe(true);
	});

	it('allows stepping forward when next lands exactly on the max date', () => {
		const oneBeforeMax = maxDate.subtract({ days: 1 });
		expect(canStepToNextDay(oneBeforeMax, today)).toBe(true);
	});

	it('disallows stepping forward when target is already at max (next would exceed)', () => {
		expect(canStepToNextDay(maxDate, today)).toBe(false);
	});
});

describe('getBollTitle', () => {
	it('returns the weekday-prefixed title for each day of the week', () => {
		// 2026-04-13 is a Monday
		expect(getBollTitle(Temporal.PlainDate.from('2026-04-13'))).toBe('Måndagsboll ⚽️');
		expect(getBollTitle(Temporal.PlainDate.from('2026-04-14'))).toBe('Tisdagsboll ⚽️');
		expect(getBollTitle(Temporal.PlainDate.from('2026-04-15'))).toBe('Onsdagsboll ⚽️');
		expect(getBollTitle(Temporal.PlainDate.from('2026-04-16'))).toBe('Torsdagsboll ⚽️');
		expect(getBollTitle(Temporal.PlainDate.from('2026-04-17'))).toBe('Fredagsboll ⚽️');
		expect(getBollTitle(Temporal.PlainDate.from('2026-04-18'))).toBe('Lördagsboll ⚽️');
		expect(getBollTitle(Temporal.PlainDate.from('2026-04-19'))).toBe('Söndagsboll ⚽️');
	});
});

describe('formattedTimeToMinutes', () => {
	it('converts 0:00 to 0', () => {
		expect(formattedTimeToMinutes('0:00')).toBe(0);
	});

	it('converts time strings to total minutes', () => {
		expect(formattedTimeToMinutes('1:00')).toBe(60);
		expect(formattedTimeToMinutes('12:30')).toBe(750);
		expect(formattedTimeToMinutes('23:59')).toBe(1439);
	});
});

describe('formatScrapedAt', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns "just nu" for less than 1 minute ago', () => {
		vi.useFakeTimers();
		const now = new Date('2025-01-12T12:00:00Z');
		vi.setSystemTime(now);

		expect(formatScrapedAt('2025-01-12T12:00:00Z')).toBe('just nu');
		expect(formatScrapedAt('2025-01-12T11:59:30Z')).toBe('just nu');
	});

	it('returns "1 minut sedan" for exactly 1 minute ago', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-12T12:01:00Z'));

		expect(formatScrapedAt('2025-01-12T12:00:00Z')).toBe('1 minut sedan');
	});

	it('returns minutes for 2-59 minutes ago', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-12T12:05:00Z'));

		expect(formatScrapedAt('2025-01-12T12:00:00Z')).toBe('5 minuter sedan');
	});

	it('returns "1 timme sedan" for exactly 1 hour ago', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-12T13:00:00Z'));

		expect(formatScrapedAt('2025-01-12T12:00:00Z')).toBe('1 timme sedan');
	});

	it('returns hours for 2-23 hours ago', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-12T15:00:00Z'));

		expect(formatScrapedAt('2025-01-12T12:00:00Z')).toBe('3 timmar sedan');
	});

	it('returns "1 dag sedan" for exactly 1 day ago', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-13T12:00:00Z'));

		expect(formatScrapedAt('2025-01-12T12:00:00Z')).toBe('1 dag sedan');
	});

	it('returns days for multiple days ago', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-15T12:00:00Z'));

		expect(formatScrapedAt('2025-01-12T12:00:00Z')).toBe('3 dagar sedan');
	});

	it('returns 59 minutes for just under 1 hour', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-12T12:59:30Z'));

		expect(formatScrapedAt('2025-01-12T12:00:00Z')).toBe('59 minuter sedan');
	});
});
