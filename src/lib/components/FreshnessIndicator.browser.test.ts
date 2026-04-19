import { render } from 'vitest-browser-svelte';
import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest';
import FreshnessIndicator from './FreshnessIndicator.svelte';

describe('FreshnessIndicator', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2025-01-12T12:05:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	test('shows relative time for scrapedAt', async () => {
		const screen = render(FreshnessIndicator, {
			scrapedAt: '2025-01-12T12:00:00Z',
			refreshing: false
		});

		await expect.element(screen.getByText(/Hämtades 5 minuter sedan/)).toBeVisible();
	});

	test('shows "just nu" for very recent scrape', async () => {
		const screen = render(FreshnessIndicator, {
			scrapedAt: '2025-01-12T12:05:00Z',
			refreshing: false
		});

		await expect.element(screen.getByText(/Hämtades just nu/)).toBeVisible();
	});

	test('does not show "Uppdaterar..." when not refreshing', async () => {
		const screen = render(FreshnessIndicator, {
			scrapedAt: '2025-01-12T12:00:00Z',
			refreshing: false
		});

		expect(screen.getByText('Uppdaterar...').query()).toBeNull();
	});

	test('shows "Uppdaterar..." when refreshing', async () => {
		const screen = render(FreshnessIndicator, {
			scrapedAt: '2025-01-12T12:00:00Z',
			refreshing: true
		});

		await expect.element(screen.getByText(/Uppdaterar/)).toBeVisible();
	});

	test('has a status role for accessibility', async () => {
		const screen = render(FreshnessIndicator, {
			scrapedAt: '2025-01-12T12:00:00Z',
			refreshing: false
		});

		await expect.element(screen.getByRole('status')).toBeVisible();
	});

	test('shows full date and time in popover', async () => {
		const screen = render(FreshnessIndicator, {
			scrapedAt: '2025-01-12T12:00:00Z',
			refreshing: false
		});

		// The popover should contain the full Swedish-formatted date
		const popover = screen.container.querySelector('[popover]');
		expect(popover).not.toBeNull();
		expect(popover?.textContent).toContain('12');
		expect(popover?.textContent).toContain('januari');
		expect(popover?.textContent).toContain('2025');
	});
});
