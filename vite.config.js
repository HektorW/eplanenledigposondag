import { sveltekit } from '@sveltejs/kit/vite';
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
					exclude: ['src/**/*.scraping.test.{js,ts}']
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
