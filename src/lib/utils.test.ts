import { describe, it, expect } from 'vitest';
import { print24HourTime, getNextSundayDate, formattedTimeToMinutes } from './utils';

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
