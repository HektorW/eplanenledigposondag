import { describe, expect, it } from 'vitest';
import {
	buildPageQuery,
	DEFAULT_FIELD_ID,
	FIELD_LIST,
	getField,
	isFieldId,
	parseFieldId
} from './fields';

describe('parseFieldId', () => {
	it('defaults to the first field when missing', () => {
		expect(parseFieldId(null)).toEqual({ fieldId: FIELD_LIST[0].id, usedFallback: false });
		expect(parseFieldId('')).toEqual({ fieldId: FIELD_LIST[0].id, usedFallback: false });
	});

	it('accepts every configured field', () => {
		for (const field of FIELD_LIST) {
			expect(parseFieldId(field.id)).toEqual({ fieldId: field.id, usedFallback: false });
		}
	});

	it('falls back on unknown fields', () => {
		expect(parseFieldId('nope')).toEqual({ fieldId: DEFAULT_FIELD_ID, usedFallback: true });
	});
});

describe('isFieldId', () => {
	it('rejects non-strings and unknown ids', () => {
		expect(isFieldId(undefined)).toBe(false);
		expect(isFieldId(42)).toBe(false);
		expect(isFieldId('nope')).toBe(false);
		expect(isFieldId(DEFAULT_FIELD_ID)).toBe(true);
	});
});

describe('buildPageQuery', () => {
	it('omits the default field', () => {
		expect(buildPageQuery({ date: '2026-10-11', fieldId: DEFAULT_FIELD_ID })).toBe(
			'?date=2026-10-11'
		);
	});

	it('includes non-default fields', () => {
		expect(buildPageQuery({ date: '2026-10-11', fieldId: 'mellanheden' })).toBe(
			'?date=2026-10-11&field=mellanheden'
		);
	});
});

describe('getField', () => {
	it('returns the config for a field id', () => {
		expect(getField('mellanheden').name).toBe('Mellanheden');
	});
});

describe('FIELD_LIST', () => {
	it('has unique ids', () => {
		const idList = FIELD_LIST.map((field) => field.id);
		expect(new Set(idList).size).toBe(idList.length);
	});
});
