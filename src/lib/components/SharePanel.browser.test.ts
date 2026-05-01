import { Temporal } from '@js-temporal/polyfill';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import {
	CALENDAR_START_MINUTES,
	COURT_LABEL,
	MIN_SUGGESTION_DURATION_MINUTES
} from '$lib/calendar';
import { halfCourtAId } from '$lib/ids';
import { generateShareImage } from '$lib/shareImage';
import type { Booking, TimeSuggestion } from '$lib/types';
import SharePanel from './SharePanel.svelte';

vi.mock('$lib/shareImage', () => ({
	generateShareImage: vi.fn()
}));

function makeSuggestion(overrides: Partial<TimeSuggestion> = {}): TimeSuggestion {
	return {
		startMinutes: 10 * 60,
		durationMinutes: 60,
		court: 'a',
		...overrides
	};
}

function makeBooking(overrides: Partial<Booking> & Pick<Booking, 'resourceId'>): Booking {
	return {
		bookingId: 'b',
		bookedBy: 'Someone',
		startTimeFormatted: '10:00',
		endTimeFormatted: '11:00',
		...overrides
	};
}

function baseProps() {
	return {
		suggestion: makeSuggestion(),
		bookings: [] as Booking[],
		date: Temporal.PlainDate.from('2026-04-19')
	};
}

describe('SharePanel rendering', () => {
	it('renders the dialog when a suggestion is set', async () => {
		const screen = render(SharePanel, { props: baseProps() });

		await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
	});

	it('does not render the dialog when suggestion is null', () => {
		render(SharePanel, { props: { ...baseProps(), suggestion: null } });

		expect(document.querySelector('dialog')).toBeNull();
	});

	it('displays the court label from COURT_LABEL', async () => {
		const screen = render(SharePanel, {
			props: { ...baseProps(), suggestion: makeSuggestion({ court: 'b' }) }
		});

		await expect.element(screen.getByText(COURT_LABEL.b)).toBeInTheDocument();
	});

	it('displays the 24-hour start and end times derived from the suggestion', async () => {
		const screen = render(SharePanel, {
			props: {
				...baseProps(),
				suggestion: makeSuggestion({ startMinutes: 11 * 60, durationMinutes: 90 })
			}
		});

		await expect.element(screen.getByText('11:00')).toBeInTheDocument();
		await expect.element(screen.getByText('12:30')).toBeInTheDocument();
	});
});

describe('SharePanel close behavior', () => {
	it('hides the dialog when the close button is clicked', async () => {
		const screen = render(SharePanel, { props: baseProps() });

		await screen.getByRole('button', { name: 'Stäng' }).click();

		await expect.poll(() => document.querySelector('dialog')).toBeNull();
	});

	it('hides the dialog when Escape is pressed', async () => {
		render(SharePanel, { props: baseProps() });

		window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

		await expect.poll(() => document.querySelector('dialog')).toBeNull();
	});
});

describe('SharePanel adjust controls', () => {
	it('advances the start time by 15 minutes when the later-start button is clicked', async () => {
		const screen = render(SharePanel, {
			props: { ...baseProps(), suggestion: makeSuggestion({ startMinutes: 10 * 60 }) }
		});

		await screen.getByRole('button', { name: 'Senare starttid' }).click();

		await expect.element(screen.getByText('10:15')).toBeInTheDocument();
	});

	it('does not move the start before CALENDAR_START_MINUTES', async () => {
		render(SharePanel, {
			props: {
				...baseProps(),
				suggestion: makeSuggestion({ startMinutes: CALENDAR_START_MINUTES })
			}
		});

		await document.querySelector<HTMLButtonElement>('[aria-label="Tidigare starttid"]')?.click();

		expect(document.body.textContent).not.toContain('8:45');
	});

	it('does not advance the start into a booking on the same court', async () => {
		const bookings = [
			makeBooking({
				resourceId: halfCourtAId,
				startTimeFormatted: '10:00',
				endTimeFormatted: '11:00'
			})
		];
		render(SharePanel, {
			props: {
				...baseProps(),
				bookings,
				suggestion: makeSuggestion({ startMinutes: 9 * 60, durationMinutes: 60 })
			}
		});

		await document.querySelector<HTMLButtonElement>('[aria-label="Senare starttid"]')?.click();

		expect(document.body.textContent).not.toContain('9:15');
	});

	it('shrinks the duration by 15 minutes when above the minimum', async () => {
		const screen = render(SharePanel, {
			props: { ...baseProps(), suggestion: makeSuggestion({ durationMinutes: 60 }) }
		});

		await screen.getByRole('button', { name: 'Kortare tid' }).click();

		await expect.element(screen.getByText('10:45')).toBeInTheDocument();
	});

	it('does not shrink the duration below MIN_SUGGESTION_DURATION_MINUTES', async () => {
		render(SharePanel, {
			props: {
				...baseProps(),
				suggestion: makeSuggestion({ durationMinutes: MIN_SUGGESTION_DURATION_MINUTES })
			}
		});
		const belowMinimumEnd = '10:15'; // 10:00 + (MIN - 15)

		await document.querySelector<HTMLButtonElement>('[aria-label="Kortare tid"]')?.click();

		expect(document.body.textContent).not.toContain(belowMinimumEnd);
	});
});

describe('SharePanel share flow', () => {
	let shareSpy: ReturnType<typeof vi.fn>;
	let canShareReturn = true;
	let anchorClickSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		vi.mocked(generateShareImage).mockResolvedValue(new Blob(['png'], { type: 'image/png' }));

		shareSpy = vi.fn().mockResolvedValue(undefined);
		canShareReturn = true;

		Object.defineProperty(navigator, 'share', { value: shareSpy, configurable: true });
		Object.defineProperty(navigator, 'canShare', {
			value: () => canShareReturn,
			configurable: true
		});

		anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
		vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
		vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('shares a PNG file via navigator.share when canShare returns true', async () => {
		const screen = render(SharePanel, { props: baseProps() });

		await screen.getByRole('button', { name: 'Dela bild' }).click();

		await expect.poll(() => shareSpy.mock.calls.length).toBe(1);
		const [shareArg] = shareSpy.mock.calls[0] as [{ files: File[] }];
		expect(shareArg.files).toHaveLength(1);
		expect(shareArg.files[0].type).toBe('image/png');
		expect(anchorClickSpy).not.toHaveBeenCalled();
	});

	it('downloads the PNG via an anchor click when canShare returns false', async () => {
		canShareReturn = false;
		const screen = render(SharePanel, { props: baseProps() });

		await screen.getByRole('button', { name: 'Dela bild' }).click();

		await expect.poll(() => anchorClickSpy.mock.calls.length).toBe(1);
		expect(shareSpy).not.toHaveBeenCalled();
	});

	it('does not show an error when the share is aborted by the user', async () => {
		shareSpy.mockRejectedValue(new DOMException('user abort', 'AbortError'));
		const screen = render(SharePanel, { props: baseProps() });

		await screen.getByRole('button', { name: 'Dela bild' }).click();

		await expect.element(screen.getByRole('button', { name: 'Dela bild' })).toBeInTheDocument();
		expect(document.querySelector('[role="alert"]')).toBeNull();
	});

	it('shows an error alert when share fails for a non-abort reason', async () => {
		shareSpy.mockRejectedValue(new Error('boom'));
		const screen = render(SharePanel, { props: baseProps() });

		await screen.getByRole('button', { name: 'Dela bild' }).click();

		await expect.element(screen.getByRole('alert')).toBeInTheDocument();
	});
});
