import { describe, it, expect } from 'vitest';
import { attempt, isFail, isOk, assertIsOk } from './attempt';

describe('attempt', () => {
	it('returns the resolved value for a successful async function', async () => {
		const result = await attempt(() => Promise.resolve(42));
		expect(isOk(result)).toBe(true);
		expect(result).toBe(42);
	});

	it('returns a Fail object for a rejecting async function', async () => {
		const error = new Error('something went wrong');
		const result = await attempt(() => Promise.reject(error));
		expect(isFail(result)).toBe(true);
	});

	it('captures the original error in the Fail object', async () => {
		const error = new Error('original error');
		const result = await attempt(() => Promise.reject(error));

		if (isFail(result)) {
			expect(result.error).toBe(error);
		} else {
			expect.unreachable('expected result to be Fail');
		}
	});
});

describe('isFail and isOk', () => {
	it('isFail returns false for a successful result', async () => {
		const result = await attempt(() => Promise.resolve('success'));
		expect(isFail(result)).toBe(false);
	});

	it('isOk returns true for a successful result', async () => {
		const result = await attempt(() => Promise.resolve('success'));
		expect(isOk(result)).toBe(true);
	});

	it('isFail returns true for a failed result', async () => {
		const result = await attempt(() => Promise.reject(new Error('fail')));
		expect(isFail(result)).toBe(true);
	});

	it('isOk returns false for a failed result', async () => {
		const result = await attempt(() => Promise.reject(new Error('fail')));
		expect(isOk(result)).toBe(false);
	});
});

describe('assertIsOk', () => {
	it('does not throw for an Ok result', async () => {
		const result = await attempt(() => Promise.resolve('value'));
		expect(() => assertIsOk(result)).not.toThrow();
	});

	it('throws the original error for a Fail result', async () => {
		const error = new Error('the original error');
		const result = await attempt(() => Promise.reject(error));
		expect(() => assertIsOk(result)).toThrow(error);
	});
});
