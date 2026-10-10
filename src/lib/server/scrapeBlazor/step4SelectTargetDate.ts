import { assertNonNullish } from '$lib/assert';
import { MAX_FUTURE_DAYS } from '$lib/utils';
import { Temporal } from '@js-temporal/polyfill';
import type { Page } from 'puppeteer-core';
import { resourceAndDateRegex } from './constants';
import { withSelector } from './withElement';
import { attempt, isFail } from '$lib/attempt';
import { createLogger } from '../logger';
import { waitForUnblocked } from './waitForUnblocked';

const logger = createLogger('scrapeBlazor:step4SelectTargetDate');

/**
 * How long to give the scheduler to show a new date after a Previous/Next
 * click. Observed 60-500ms. A click made while the scheduler is still loading
 * the current day's events is dropped (no loading indicator exists to wait
 * on), so on timeout the click is simply repeated.
 */
const NAV_CHANGE_TIMEOUT_MS = 1500;
// Target is at most MAX_FUTURE_DAYS ahead; a few extra steps cover a
// dropped click or an overshoot that has to be walked back.
const MAX_NAV_STEPS = MAX_FUTURE_DAYS + 4;

const navDaySelector = '.k-link.k-nav-day';

export async function selectTargetDate(page: Page, targetDate: Temporal.PlainDate) {
	const targetDateStr = formatNavDay(targetDate);

	for (let step = 0; step < MAX_NAV_STEPS; step++) {
		const navDayText = await readNavDayText(page);

		if (navDayText.includes(targetDateStr)) {
			logger.debug('Found target day:', navDayText);
			await waitForTargetDateBookingsAreVisible(page, targetDate);
			return;
		}

		const shownDate = parseNavDay(navDayText, targetDate);
		// Direction from the shown date, so an overshoot walks back instead of
		// running off the end. Unparseable → assume we are before the target.
		const direction: NavDirection =
			shownDate && Temporal.PlainDate.compare(shownDate, targetDate) > 0 ? 'Previous' : 'Next';
		logger.debug('Target day not shown, navigating', { navDayText, direction });

		await waitForUnblocked(page);
		await clickNavButton(page, direction);

		const changed = await attempt(() =>
			page.waitForFunction(
				(selector: string, oldText: string) =>
					document.querySelector(selector)?.textContent?.trim() !== oldText,
				{ timeout: NAV_CHANGE_TIMEOUT_MS },
				navDaySelector,
				navDayText
			)
		);
		if (isFail(changed)) {
			logger.debug('Shown date did not change after click, clicking again');
		}
	}

	throw new Error(`Could not navigate to ${targetDateStr} in ${MAX_NAV_STEPS} steps`);
}

type NavDirection = 'Previous' | 'Next';

/** The scheduler's day header, e.g. "Sun 11/10". */
function formatNavDay(date: Temporal.PlainDate): string {
	const dayAbbreviation = date.toLocaleString('en-US', { weekday: 'short' });
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${dayAbbreviation} ${pad(date.day)}/${pad(date.month)}`;
}

/**
 * Parses the scheduler's day header ("Sun 11/10") back into a date. The
 * header has no year, so pick the year that puts it closest to
 * `referenceDate` (matters around New Year).
 */
export function parseNavDay(
	text: string,
	referenceDate: Temporal.PlainDate
): Temporal.PlainDate | null {
	const match = text.match(/(\d{1,2})\/(\d{1,2})/);
	if (!match) return null;
	const day = Number(match[1]);
	const month = Number(match[2]);

	const yearList = [referenceDate.year - 1, referenceDate.year, referenceDate.year + 1];
	const candidateList = yearList.flatMap((year) => {
		try {
			return [Temporal.PlainDate.from({ year, month, day }, { overflow: 'reject' })];
		} catch {
			return [];
		}
	});
	const distance = (date: Temporal.PlainDate) => Math.abs(date.until(referenceDate).total('days'));
	candidateList.sort((a, b) => distance(a) - distance(b));
	return candidateList[0] ?? null;
}

async function readNavDayText(page: Page): Promise<string> {
	return withSelector(page, navDaySelector, async (element) => {
		assertNonNullish(element, 'Date element not found');
		const text = await element.evaluate((el) => el.textContent?.trim());
		assertNonNullish(text, 'Element text not found');
		return text;
	});
}

async function clickNavButton(page: Page, direction: NavDirection) {
	await withSelector(page, `.k-toolbar button[aria-label="${direction}"]`, async (button) => {
		assertNonNullish(button, `${direction} button not found`);
		await button.click();
	});
}

async function waitForTargetDateBookingsAreVisible(page: Page, targetDate: Temporal.PlainDate) {
	logger.debug('Waiting for target date bookings to be visible...');

	const targetMonth = targetDate.month;
	const targetDay = targetDate.day;

	// First check if any events appear within 1500ms.
	// If none appear, assume it's an empty day and move on.
	// Note: the scraper arrives here faster now that CDP polling overhead is gone,
	// so Blazor needs more wall-clock time to finish rendering events.
	let hasEvents = false;
	try {
		await page.waitForFunction(
			() => document.querySelectorAll('.k-scheduler-body .k-event').length > 0,
			{ timeout: 1500 }
		);
		hasEvents = true;
	} catch {
		// No events appeared — likely an empty day
	}

	if (hasEvents) {
		// Events exist — wait for them to match the target date
		await page.waitForFunction(
			(month: number, day: number, regexSource: string) => {
				const events = document.querySelectorAll('.k-scheduler-body .k-event');
				const first = events[0];
				if (!first) return false;
				const ariaLabel = first.getAttribute('aria-label');
				if (!ariaLabel) return false;
				const match = ariaLabel.match(new RegExp(regexSource));
				if (!match) return false;
				const startDate = match[2];
				const [m, d] = startDate.split('/').map(Number);
				return m === month && d === day;
			},
			{ timeout: 2000 },
			targetMonth,
			targetDay,
			resourceAndDateRegex.source
		);
	}

	logger.debug('Target date bookings are visible');
}
