import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getStoredTheme, isTheme, resolveEffectiveTheme } from './theme';

describe('isTheme', () => {
	it('accepts the three supported values', () => {
		expect(isTheme('system')).toBe(true);
		expect(isTheme('light')).toBe(true);
		expect(isTheme('dark')).toBe(true);
	});

	it('rejects anything else', () => {
		expect(isTheme('')).toBe(false);
		expect(isTheme('Dark')).toBe(false);
		expect(isTheme('auto')).toBe(false);
		expect(isTheme(null)).toBe(false);
		expect(isTheme(undefined)).toBe(false);
		expect(isTheme(42)).toBe(false);
		expect(isTheme({})).toBe(false);
	});
});

describe('getStoredTheme', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it.each(['system', 'light', 'dark'] as const)('returns %s when that value is stored', (value) => {
		vi.stubGlobal('localStorage', {
			getItem: () => value
		});

		expect(getStoredTheme()).toBe(value);
	});

	it('falls back to system when nothing is stored', () => {
		vi.stubGlobal('localStorage', {
			getItem: () => null
		});

		expect(getStoredTheme()).toBe('system');
	});

	it('falls back to system when the stored value is not a Theme', () => {
		vi.stubGlobal('localStorage', {
			getItem: () => 'sepia'
		});

		expect(getStoredTheme()).toBe('system');
	});

	it('falls back to system when localStorage access throws', () => {
		vi.stubGlobal('localStorage', {
			getItem: () => {
				throw new Error('unavailable');
			}
		});

		expect(getStoredTheme()).toBe('system');
	});
});

describe('resolveEffectiveTheme', () => {
	it('returns the explicit theme when it is light or dark', () => {
		expect(resolveEffectiveTheme('light', true)).toBe('light');
		expect(resolveEffectiveTheme('light', false)).toBe('light');
		expect(resolveEffectiveTheme('dark', true)).toBe('dark');
		expect(resolveEffectiveTheme('dark', false)).toBe('dark');
	});

	it('follows the system preference when theme is system', () => {
		expect(resolveEffectiveTheme('system', true)).toBe('dark');
		expect(resolveEffectiveTheme('system', false)).toBe('light');
	});
});

describe('pre-paint theme colors stay in sync with CSS tokens', () => {
	const appHtml = readFileSync(new URL('../app.html', import.meta.url), 'utf8');
	const layoutSvelte = readFileSync(new URL('../routes/+layout.svelte', import.meta.url), 'utf8');

	function cssVar(name: string): string {
		const match = layoutSvelte.match(new RegExp(`${name}:\\s*([^;]+);`));
		if (!match) throw new Error(`CSS var ${name} not found in +layout.svelte`);
		return match[1].trim();
	}

	const blue20 = cssVar('--c--blue--20');
	const blue96 = cssVar('--c--blue--96');

	const ternary = appHtml.match(/effective === 'dark'\s*\?\s*'([^']+)'\s*:\s*'([^']+)'/);
	const inlineDark = ternary?.[1];
	const inlineLight = ternary?.[2];

	const metaDefault = appHtml.match(/<meta name="theme-color" content="([^"]+)"/)?.[1];

	it('dark color in app.html matches --c--blue--20', () => {
		expect(inlineDark).toBe(blue20);
	});

	it('light color in app.html matches --c--blue--96', () => {
		expect(inlineLight).toBe(blue96);
	});

	it('default meta theme-color matches --c--blue--96', () => {
		expect(metaDefault).toBe(blue96);
	});
});
