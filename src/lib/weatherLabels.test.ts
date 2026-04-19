import { describe, it, expect } from 'vitest';
import { symbolCodeLabel } from './weatherLabels';

describe('symbolCodeLabel', () => {
	it('returns undefined for unknown symbol codes', () => {
		expect(symbolCodeLabel['nonexistent_code']).toBeUndefined();
	});

	it('has no empty string labels', () => {
		for (const [key, value] of Object.entries(symbolCodeLabel)) {
			if (value !== undefined) {
				expect(value.length, `label for "${key}" should not be empty`).toBeGreaterThan(0);
			}
		}
	});

	it('returns a string for known symbol codes', () => {
		// Spot-check a few representative codes to verify the mapping works
		expect(typeof symbolCodeLabel['clearsky_day']).toBe('string');
		expect(typeof symbolCodeLabel['rain']).toBe('string');
	});
});
