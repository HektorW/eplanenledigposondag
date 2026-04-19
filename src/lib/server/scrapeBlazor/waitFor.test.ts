import { describe, it, expect } from 'vitest';
import { waitFor } from './waitFor';

describe('waitFor', () => {
	it('returns immediately when poll function returns a truthy result', async () => {
		const result = await waitFor(() => Promise.resolve('found'));
		expect(result).toBe('found');
	});

	it('keeps polling until the function returns a truthy result', async () => {
		let callCount = 0;
		const result = await waitFor(
			() => {
				callCount++;
				return Promise.resolve(callCount >= 3 ? 'found' : null);
			},
			{ maxTime: 5000, pollInterval: 10 }
		);

		expect(result).toBe('found');
		expect(callCount).toBe(3);
	});

	it('throws on timeout with default error message', async () => {
		await expect(
			waitFor(() => Promise.resolve(null), { maxTime: 50, pollInterval: 10 })
		).rejects.toThrow('waitFor: Timeout after 50ms while waiting.');
	});

	it('throws on timeout with custom error message', async () => {
		await expect(
			waitFor(() => Promise.resolve(null), {
				maxTime: 50,
				pollInterval: 10,
				errorMessage: 'Custom timeout message'
			})
		).rejects.toThrow('Custom timeout message');
	});

	it('passes elapsed time to the poll function', async () => {
		const elapsedTimes: number[] = [];
		let callCount = 0;

		await waitFor(
			(elapsedTime) => {
				elapsedTimes.push(elapsedTime);
				callCount++;
				return Promise.resolve(callCount >= 2 ? 'done' : null);
			},
			{ maxTime: 5000, pollInterval: 10 }
		);

		expect(elapsedTimes).toHaveLength(2);
		expect(elapsedTimes[1]).toBeGreaterThanOrEqual(elapsedTimes[0]);
	});

	it('defaults to 2000ms timeout when no options provided', async () => {
		await expect(waitFor(() => Promise.resolve(null))).rejects.toThrow(
			'waitFor: Timeout after 2000ms while waiting.'
		);
	});

	it('returns different truthy types as-is', async () => {
		expect(await waitFor(() => Promise.resolve(42))).toBe(42);
		expect(await waitFor(() => Promise.resolve({ key: 'value' }))).toEqual({ key: 'value' });
		expect(await waitFor(() => Promise.resolve([1, 2, 3]))).toEqual([1, 2, 3]);
	});

	it('treats 0 and empty string as falsy and continues polling', async () => {
		let callCount = 0;
		const result = await waitFor(
			() => {
				callCount++;
				if (callCount === 1) return Promise.resolve(0 as unknown as null);
				if (callCount === 2) return Promise.resolve('' as unknown as null);
				return Promise.resolve('actual value');
			},
			{ maxTime: 5000, pollInterval: 10 }
		);

		expect(result).toBe('actual value');
		expect(callCount).toBe(3);
	});
});
