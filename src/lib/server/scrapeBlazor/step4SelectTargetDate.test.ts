import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { parseNavDay } from './step4SelectTargetDate';

const date = (iso: string) => Temporal.PlainDate.from(iso);

describe('parseNavDay', () => {
	it('parses the scheduler day header', () => {
		expect(parseNavDay('Sun 11/10', date('2026-10-09'))?.toString()).toBe('2026-10-11');
	});

	it('picks the year closest to the reference around New Year', () => {
		expect(parseNavDay('Thu 01/01', date('2026-12-30'))?.toString()).toBe('2027-01-01');
		expect(parseNavDay('Wed 31/12', date('2027-01-03'))?.toString()).toBe('2026-12-31');
	});

	it('returns null for text without a date', () => {
		expect(parseNavDay('', date('2026-10-09'))).toBeNull();
		expect(parseNavDay('week 41 2026', date('2026-10-09'))).toBeNull();
	});

	it('rejects impossible dates', () => {
		expect(parseNavDay('Xxx 31/02', date('2026-10-09'))).toBeNull();
	});
});
