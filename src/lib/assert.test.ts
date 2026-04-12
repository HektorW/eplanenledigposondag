import { describe, it, expect } from 'vitest';
import { assertNonNullish } from './assert';

describe('assertNonNullish', () => {
	it('does not throw for non-nullish values', () => {
		expect(() => assertNonNullish('hello', 'msg')).not.toThrow();
		expect(() => assertNonNullish(42, 'msg')).not.toThrow();
		expect(() => assertNonNullish(true, 'msg')).not.toThrow();
		expect(() => assertNonNullish({}, 'msg')).not.toThrow();
	});

	it('does not throw for falsy but non-nullish values', () => {
		expect(() => assertNonNullish(0, 'msg')).not.toThrow();
		expect(() => assertNonNullish('', 'msg')).not.toThrow();
		expect(() => assertNonNullish(false, 'msg')).not.toThrow();
	});

	it('throws for null with the provided message', () => {
		expect(() => assertNonNullish(null, 'value was null')).toThrow('value was null');
	});

	it('throws for undefined with the provided message', () => {
		expect(() => assertNonNullish(undefined, 'value was undefined')).toThrow('value was undefined');
	});
});
