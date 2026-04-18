import { describe, it, expect } from 'vitest';
import {
	print24HourTime,
	getNextSundayDate,
	parseTargetDate,
	formattedTimeToMinutes,
	canStepToPrevDay,
	canStepToNextDay,
	MAX_FUTURE_DAYS
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
		const wednesday = new Date(2025, 0, 8, 12, 0, 0);
		const result = getNextSundayDate(wednesday);
		expect(result.getDay()).toBe(0); // Sunday
		expect(result.getDate()).toBe(12);
	});

	it('returns same Sunday if before 22:00', () => {
		// 2025-01-12 is a Sunday
		const sundayMorning = new Date(2025, 0, 12, 10, 0, 0);
		const result = getNextSundayDate(sundayMorning);
		expect(result.getDay()).toBe(0);
		expect(result.getDate()).toBe(12);
	});

	it('returns next Sunday if Sunday at or after 22:00', () => {
		// 2025-01-12 is a Sunday at 22:00
		const sundayEvening = new Date(2025, 0, 12, 22, 0, 0);
		const result = getNextSundayDate(sundayEvening);
		expect(result.getDay()).toBe(0);
		expect(result.getDate()).toBe(19);
	});

	it('returns next day from a Saturday', () => {
		// 2025-01-11 is a Saturday
		const saturday = new Date(2025, 0, 11, 12, 0, 0);
		const result = getNextSundayDate(saturday);
		expect(result.getDay()).toBe(0);
		expect(result.getDate()).toBe(12);
	});
});

describe('parseTargetDate', () => {
	// 2026-04-13 is a Monday
	const now = new Date(2026, 3, 13, 12, 0, 0);

	it('returns next Sunday with usedFallback false when param is null', () => {
		const result = parseTargetDate(null, now);
		expect(result.usedFallback).toBe(false);
		expect(result.date.getDay()).toBe(0); // Sunday
	});

	it('parses a valid ISO date within range', () => {
		const result = parseTargetDate('2026-04-15', now);
		expect(result.usedFallback).toBe(false);
		expect(result.date.getFullYear()).toBe(2026);
		expect(result.date.getMonth()).toBe(3); // April (0-indexed)
		expect(result.date.getDate()).toBe(15);
	});

	it('accepts today', () => {
		const result = parseTargetDate('2026-04-13', now);
		expect(result.usedFallback).toBe(false);
		expect(result.date.getDate()).toBe(13);
	});

	it('accepts the last day within range', () => {
		const result = parseTargetDate('2026-04-23', now);
		expect(result.usedFallback).toBe(false);
		expect(result.date.getDate()).toBe(23);
	});

	it('falls back on empty string', () => {
		const result = parseTargetDate('', now);
		expect(result.usedFallback).toBe(false);
		expect(result.date.getDay()).toBe(0);
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
		const leapNow = new Date(2028, 1, 25, 12, 0, 0);
		const result = parseTargetDate('2028-02-29', leapNow);
		expect(result.usedFallback).toBe(false);
		expect(result.date.getMonth()).toBe(1);
		expect(result.date.getDate()).toBe(29);
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
	const now = new Date(2026, 3, 13, 12, 0, 0);

	it('allows stepping back when target is after today', () => {
		expect(canStepToPrevDay(new Date(2026, 3, 15), now)).toBe(true);
	});

	it('allows stepping back when target is tomorrow (prev lands on today)', () => {
		expect(canStepToPrevDay(new Date(2026, 3, 14), now)).toBe(true);
	});

	it('disallows stepping back when target is today (prev would land before today)', () => {
		expect(canStepToPrevDay(new Date(2026, 3, 13), now)).toBe(false);
	});
});

describe('canStepToNextDay', () => {
	// 2026-04-13 is a Monday; max future = today + MAX_FUTURE_DAYS
	const now = new Date(2026, 3, 13, 12, 0, 0);
	const maxDate = new Date(2026, 3, 13 + MAX_FUTURE_DAYS);

	it('allows stepping forward within range', () => {
		expect(canStepToNextDay(new Date(2026, 3, 13), now)).toBe(true);
	});

	it('allows stepping forward when next lands exactly on the max date', () => {
		const oneBeforeMax = new Date(maxDate);
		oneBeforeMax.setDate(oneBeforeMax.getDate() - 1);
		expect(canStepToNextDay(oneBeforeMax, now)).toBe(true);
	});

	it('disallows stepping forward when target is already at max (next would exceed)', () => {
		expect(canStepToNextDay(maxDate, now)).toBe(false);
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
