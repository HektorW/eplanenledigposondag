import { describe, expect, it } from 'vitest';
import { resourceAndDateRegex } from './constants';

describe('resourceAndDateRegex', () => {
	it.each([
		['Sorgenfri IP / Konstgräs 11-spels / 7-spels 1, Starts at 10:00, Ends at 11:00', '1'],
		['Dalhems IP / Konstgräs 11-spels / 7-manna 2, Starts at 10:00, Ends at 11:00', '2'],
		['Sorgenfri IP / Konstgräs 11-spels, Starts at 10:00, Ends at 11:00', undefined]
	])('parses %s', (text, expectedIndex) => {
		const match = text.match(resourceAndDateRegex);
		expect(match).not.toBeNull();
		expect(match?.[1]).toBe(expectedIndex);
		expect(match?.[2]).toBe('10:00');
		expect(match?.[3]).toBe('11:00');
	});
});
