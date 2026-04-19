export type Theme = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

export function isTheme(value: unknown): value is Theme {
	return value === 'system' || value === 'light' || value === 'dark';
}

export function getStoredTheme(): Theme {
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY);
		if (isTheme(stored)) return stored;
	} catch {
		// localStorage may be unavailable (private mode, etc.)
	}
	return 'system';
}

export function resolveEffectiveTheme(theme: Theme, systemPrefersDark: boolean): 'light' | 'dark' {
	if (theme === 'light' || theme === 'dark') return theme;
	return systemPrefersDark ? 'dark' : 'light';
}

function updateMetaThemeColor() {
	const meta = document.querySelector('meta[name="theme-color"]');
	if (!meta) return;
	const color = getComputedStyle(document.documentElement)
		.getPropertyValue('--c--main--background')
		.trim();
	if (color) meta.setAttribute('content', color);
}

export function applyTheme(theme: Theme) {
	if (typeof document === 'undefined') return;

	try {
		if (theme === 'system') {
			localStorage.removeItem(THEME_STORAGE_KEY);
		} else {
			localStorage.setItem(THEME_STORAGE_KEY, theme);
		}
	} catch {
		// ignore storage failures
	}

	const update = () => {
		if (theme === 'system') {
			document.documentElement.removeAttribute('data-theme');
		} else {
			document.documentElement.setAttribute('data-theme', theme);
		}
		updateMetaThemeColor();
	};

	const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

	if (document.startViewTransition && !prefersReducedMotion) {
		document.documentElement.classList.add('theme-switching');
		const transition = document.startViewTransition(update);
		transition.finished.finally(() => {
			document.documentElement.classList.remove('theme-switching');
		});
	} else {
		update();
	}
}
