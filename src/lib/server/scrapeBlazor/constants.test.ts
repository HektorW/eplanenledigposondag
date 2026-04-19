import { describe, it, expect } from 'vitest';
import { resourceAndDateRegex } from './constants';

describe('resourceAndDateRegex', () => {
	it('matches a full court booking (no 7-manna prefix)', () => {
		const input = 'Some booking info, Starts at 1/12, Ends at 14:00';
		const match = input.match(resourceAndDateRegex);

		expect(match).not.toBeNull();
		expect(match![1]).toBeUndefined(); // no court index
		expect(match![2]).toBe('1/12');
		expect(match![3]).toBe('14:00');
	});

	it('matches a half court booking with 7-manna index', () => {
		const input = '7-manna 1, Starts at 1/12, Ends at 14:00';
		const match = input.match(resourceAndDateRegex);

		expect(match).not.toBeNull();
		expect(match![1]).toBe('1');
		expect(match![2]).toBe('1/12');
		expect(match![3]).toBe('14:00');
	});

	it('matches 7-manna 2 (half court B)', () => {
		const input = '7-manna 2, Starts at 3/15, Ends at 16:30';
		const match = input.match(resourceAndDateRegex);

		expect(match).not.toBeNull();
		expect(match![1]).toBe('2');
		expect(match![2]).toBe('3/15');
		expect(match![3]).toBe('16:30');
	});

	it('handles longer descriptions before the match', () => {
		const input = 'Fotboll, Sorgenfri IP, 7-manna 1, Starts at 6/22, Ends at 18:00';
		const match = input.match(resourceAndDateRegex);

		expect(match).not.toBeNull();
		expect(match![1]).toBe('1');
		expect(match![2]).toBe('6/22');
		expect(match![3]).toBe('18:00');
	});

	it('does not match strings without Starts at/Ends at pattern', () => {
		const input = 'Random text without the expected pattern';
		const match = input.match(resourceAndDateRegex);
		expect(match).toBeNull();
	});

	it('captures the full end time including everything after "Ends at"', () => {
		const input = '7-manna 1, Starts at 12/5, Ends at 15:00 extra info';
		const match = input.match(resourceAndDateRegex);

		expect(match).not.toBeNull();
		expect(match![3]).toBe('15:00 extra info');
	});
});
