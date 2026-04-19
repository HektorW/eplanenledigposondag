import { sveltekit } from '@sveltejs/kit/vite';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		projects: [
			{
				extends: true,
				test: {
					name: 'unit',
					include: ['src/**/*.test.{js,ts}'],
					exclude: ['src/**/*.scraping.test.{js,ts}', 'src/**/*.browser.test.{js,ts,svelte.ts}']
				}
			},
			{
				extends: true,
				test: {
					name: 'browser',
					include: ['src/**/*.browser.test.{js,ts,svelte.ts}'],
					browser: {
						enabled: true,
						provider: playwright(),
						headless: true,
						instances: [{ browser: 'chromium' }]
					}
				}
			},
			{
				extends: true,
				test: {
					name: 'scraping',
					include: ['src/**/*.scraping.test.{js,ts}'],
					testTimeout: 120_000,
					hookTimeout: 120_000
				}
			}
		]
	}
});
