/**
 * Fields (pitches) the app tracks. Order matters: the first field is the
 * default when no `?field=` param is given, and chips render in this order.
 *
 * Client-safe — scrape details live in `$lib/server/scrapeBlazor/fieldScrapeConfig`.
 */
export const FIELD_LIST = [{ id: 'sorgenfri', name: 'Sorgenfri' }] as const satisfies readonly {
	id: string;
	name: string;
}[];

export type Field = (typeof FIELD_LIST)[number];
export type FieldId = Field['id'];

export const DEFAULT_FIELD_ID: FieldId = FIELD_LIST[0].id;

export function isFieldId(value: unknown): value is FieldId {
	return FIELD_LIST.some((field) => field.id === value);
}

export type ParseFieldIdResult = {
	fieldId: FieldId;
	usedFallback: boolean;
};

/** Parses the `?field=` query param. Missing → default, unknown → default + fallback flag. */
export function parseFieldId(fieldParam: string | null): ParseFieldIdResult {
	if (!fieldParam) return { fieldId: DEFAULT_FIELD_ID, usedFallback: false };
	if (isFieldId(fieldParam)) return { fieldId: fieldParam, usedFallback: false };
	return { fieldId: DEFAULT_FIELD_ID, usedFallback: true };
}

/**
 * Query string for the page. Omits `field` for the default field so existing
 * `?date=` links stay canonical.
 */
export function buildPageQuery({
	date,
	fieldId
}: {
	date: string;
	fieldId: FieldId;
}): `?${string}` {
	const params = new URLSearchParams({ date });
	if (fieldId !== DEFAULT_FIELD_ID) params.set('field', fieldId);
	return `?${params.toString()}`;
}
