import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { CALENDAR_START_MINUTES, COURT_GRID_COLUMN, minutesToGridRow } from '$lib/calendar';
import type { TimeSuggestion } from '$lib/types';
import SuggestedTime from './SuggestedTime.svelte';

function makeSuggestion(overrides: Partial<TimeSuggestion> = {}): TimeSuggestion {
	return {
		startMinutes: CALENDAR_START_MINUTES + 60,
		durationMinutes: 60,
		court: 'a',
		...overrides
	};
}

function suggestionElement(): HTMLElement {
	const element = document.querySelector<HTMLElement>('.suggestion');
	if (!element) throw new Error('Suggestion element not rendered');
	return element;
}

describe('SuggestedTime', () => {
	it('places court A suggestions in the court A grid column', () => {
		render(SuggestedTime, { props: { suggestion: makeSuggestion({ court: 'a' }) } });

		expect(suggestionElement().style.gridColumn).toBe(COURT_GRID_COLUMN.a);
	});

	it('places court B suggestions in the court B grid column', () => {
		render(SuggestedTime, { props: { suggestion: makeSuggestion({ court: 'b' }) } });

		expect(suggestionElement().style.gridColumn).toBe(COURT_GRID_COLUMN.b);
	});

	it('spans grid rows from the start minute to start + duration', () => {
		const startMinutes = CALENDAR_START_MINUTES + 60; // 10:00
		const durationMinutes = 90;
		render(SuggestedTime, {
			props: { suggestion: makeSuggestion({ startMinutes, durationMinutes }) }
		});

		const expectedStart = minutesToGridRow(startMinutes);
		const expectedEnd = minutesToGridRow(startMinutes + durationMinutes);
		expect(suggestionElement().style.gridRow).toBe(`${expectedStart} / ${expectedEnd}`);
	});

	it('displays the 24-hour time range derived from startMinutes and durationMinutes', async () => {
		const screen = render(SuggestedTime, {
			props: { suggestion: makeSuggestion({ startMinutes: 10 * 60, durationMinutes: 90 }) }
		});

		await expect.element(screen.getByText('10:00 – 11:30')).toBeInTheDocument();
	});
});
