import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyTheme } from './theme';

describe('applyTheme', () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute('data-theme');
		document.documentElement.classList.remove('theme-switching');

		document.querySelectorAll('meta[name="theme-color"]').forEach((element) => element.remove());
		const meta = document.createElement('meta');
		meta.setAttribute('name', 'theme-color');
		meta.setAttribute('content', 'placeholder');
		document.head.appendChild(meta);

		const style = document.createElement('style');
		style.id = 'theme-test-style';
		style.textContent = `
			:root { --c--main--background: hsl(207, 100%, 96%); }
			:root[data-theme='dark'] { --c--main--background: hsl(207, 65%, 20%); }
			:root[data-theme='light'] { --c--main--background: hsl(207, 100%, 96%); }
		`;
		document.head.appendChild(style);
	});

	afterEach(() => {
		document.getElementById('theme-test-style')?.remove();
		document.querySelectorAll('meta[name="theme-color"]').forEach((element) => element.remove());
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it('writes the chosen theme to localStorage', () => {
		applyTheme('dark');
		expect(localStorage.getItem('theme')).toBe('dark');
	});

	it('removes the storage key when selecting system', () => {
		localStorage.setItem('theme', 'dark');
		applyTheme('system');
		expect(localStorage.getItem('theme')).toBeNull();
	});

	it('sets data-theme on <html>', async () => {
		applyTheme('light');
		await vi.waitFor(() => {
			expect(document.documentElement.dataset.theme).toBe('light');
		});
	});

	it('sets meta theme-color to the computed background of the active theme', async () => {
		applyTheme('dark');
		await vi.waitFor(() => {
			expect(document.documentElement.dataset.theme).toBe('dark');
		});

		const expected = getComputedStyle(document.documentElement)
			.getPropertyValue('--c--main--background')
			.trim();
		const actual = document.querySelector('meta[name="theme-color"]')?.getAttribute('content');

		expect(expected).not.toBe('');
		expect(actual).toBe(expected);
	});

	it('adds the theme-switching class synchronously and removes it when the transition finishes', async () => {
		applyTheme('dark');

		// Class is added before startViewTransition is called, so it must be
		// present synchronously after applyTheme returns.
		expect(document.documentElement.classList.contains('theme-switching')).toBe(true);

		await vi.waitFor(() => {
			expect(document.documentElement.classList.contains('theme-switching')).toBe(false);
		});
	});

	it('applies synchronously when startViewTransition is unavailable', () => {
		// startViewTransition lives on Document.prototype, so shadow it on the
		// instance to hit the fallback path without mutating the prototype.
		Object.defineProperty(document, 'startViewTransition', {
			value: undefined,
			configurable: true
		});
		try {
			applyTheme('dark');
			expect(document.documentElement.dataset.theme).toBe('dark');
			expect(document.documentElement.classList.contains('theme-switching')).toBe(false);
		} finally {
			delete (document as { startViewTransition?: unknown }).startViewTransition;
		}
	});

	it('applies synchronously when the user prefers reduced motion', () => {
		vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
			const matches = query.includes('prefers-reduced-motion');
			return {
				matches,
				media: query,
				onchange: null,
				addEventListener: () => {},
				removeEventListener: () => {},
				addListener: () => {},
				removeListener: () => {},
				dispatchEvent: () => false
			} as MediaQueryList;
		});

		applyTheme('dark');
		expect(document.documentElement.dataset.theme).toBe('dark');
		expect(document.documentElement.classList.contains('theme-switching')).toBe(false);
	});
});
