import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import ThemeSwitcher from './ThemeSwitcher.svelte';

/**
 * System-preference stub shared by every test. Each test declares the
 * preference it wants via `setSystemPrefersDark(...)` before rendering;
 * the fake MediaQueryList remembers the registered change listeners so we
 * can also simulate a live system flip.
 */
let systemPrefersDark = false;
const changeListeners = new Set<(event: MediaQueryListEvent) => void>();

function setSystemPrefersDark(value: boolean) {
	systemPrefersDark = value;
	for (const listener of changeListeners) {
		listener({ matches: value, media: '(prefers-color-scheme: dark)' } as MediaQueryListEvent);
	}
}

function iconOf(): 'sun' | 'moon' | null {
	const svg = document.querySelector('.theme-toggle svg');
	const icon = svg?.getAttribute('data-icon');
	return icon === 'sun' || icon === 'moon' ? icon : null;
}

describe('ThemeSwitcher', () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute('data-theme');
		document.documentElement.classList.remove('theme-switching');

		changeListeners.clear();
		systemPrefersDark = false;

		vi.spyOn(window, 'matchMedia').mockImplementation(
			(query: string) =>
				({
					get matches() {
						return query.includes('prefers-color-scheme: dark') && systemPrefersDark;
					},
					media: query,
					onchange: null,
					addEventListener: (type: string, callback: (event: MediaQueryListEvent) => void) => {
						if (type === 'change') changeListeners.add(callback);
					},
					removeEventListener: (type: string, callback: (event: MediaQueryListEvent) => void) => {
						if (type === 'change') changeListeners.delete(callback);
					},
					addListener: () => {},
					removeListener: () => {},
					dispatchEvent: () => false
				}) as MediaQueryList
		);

		// Skip the view transition so state changes are synchronous in tests;
		// the transition wrapping is covered in theme.browser.test.ts.
		Object.defineProperty(document, 'startViewTransition', {
			value: undefined,
			configurable: true
		});
	});

	afterEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute('data-theme');
		delete (document as { startViewTransition?: unknown }).startViewTransition;
		vi.restoreAllMocks();
	});

	it('is unpressed and shows the sun when following a light system', async () => {
		setSystemPrefersDark(false);
		const screen = render(ThemeSwitcher);
		const button = screen.getByRole('button', { name: 'Färgtema' });

		await expect.element(button).toHaveAttribute('aria-pressed', 'false');
		expect(iconOf()).toBe('sun');
	});

	it('is unpressed and shows the moon when following a dark system', async () => {
		setSystemPrefersDark(true);
		const screen = render(ThemeSwitcher);
		const button = screen.getByRole('button', { name: 'Färgtema' });

		await expect.element(button).toHaveAttribute('aria-pressed', 'false');
		expect(iconOf()).toBe('moon');
	});

	it('marks itself pressed when an override is already on <html>', async () => {
		document.documentElement.setAttribute('data-theme', 'dark');
		const screen = render(ThemeSwitcher);
		const button = screen.getByRole('button', { name: 'Färgtema' });

		await expect.element(button).toHaveAttribute('aria-pressed', 'true');
	});

	it('installs the opposite override when following a light system and clicked', async () => {
		setSystemPrefersDark(false);
		const screen = render(ThemeSwitcher);
		const button = screen.getByRole('button', { name: 'Färgtema' });

		await button.click();

		await expect.element(button).toHaveAttribute('aria-pressed', 'true');
		expect(document.documentElement.dataset.theme).toBe('dark');
		expect(iconOf()).toBe('moon');
		expect(localStorage.getItem('theme')).toBe('dark');
	});

	it('installs the opposite override when following a dark system and clicked', async () => {
		setSystemPrefersDark(true);
		const screen = render(ThemeSwitcher);
		const button = screen.getByRole('button', { name: 'Färgtema' });

		await button.click();

		await expect.element(button).toHaveAttribute('aria-pressed', 'true');
		expect(document.documentElement.dataset.theme).toBe('light');
		expect(iconOf()).toBe('sun');
		expect(localStorage.getItem('theme')).toBe('light');
	});

	it('clears the override and returns to system on a second click', async () => {
		setSystemPrefersDark(false);
		document.documentElement.setAttribute('data-theme', 'dark');
		localStorage.setItem('theme', 'dark');
		const screen = render(ThemeSwitcher);
		const button = screen.getByRole('button', { name: 'Färgtema' });

		await button.click();

		await expect.element(button).toHaveAttribute('aria-pressed', 'false');
		expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
		expect(localStorage.getItem('theme')).toBeNull();
	});

	it('updates the icon when the system preference flips while following system', async () => {
		setSystemPrefersDark(false);
		const screen = render(ThemeSwitcher);
		const button = screen.getByRole('button', { name: 'Färgtema' });

		expect(iconOf()).toBe('sun');

		setSystemPrefersDark(true);

		await expect.poll(() => iconOf()).toBe('moon');
		await expect.element(button).toHaveAttribute('aria-pressed', 'false');
	});
});
