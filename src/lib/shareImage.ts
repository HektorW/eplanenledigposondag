import type { Temporal } from '@js-temporal/polyfill';
import { assertNonNullish } from '$lib/assert';
import {
	CALENDAR_END_MINUTES,
	CALENDAR_HOURS,
	CALENDAR_ROWS,
	CALENDAR_ROWS_PER_HOUR,
	CALENDAR_START_HOUR,
	CALENDAR_START_MINUTES,
	COURT_ID_LIST,
	COURT_LABEL,
	COURT_RESOURCE_ID,
	minutesToRowIndex
} from '$lib/calendar';
import { fullCourtId } from '$lib/ids';
import type { Booking, Court, TimeSuggestion } from '$lib/types';
import { formattedTimeToMinutes, print24HourTime } from '$lib/utils';

const SCALE = 2;
const W = 460;
const H = 620;
const PAD = 18;

const HEADER_Y = PAD;
const HEADER_H = 36;
const SLOT_RADIUS = 10;
const COL_HEADER_Y = HEADER_Y + HEADER_H;
const COL_HEADER_H = 24;
const GRID_Y = COL_HEADER_Y + COL_HEADER_H;
const TIME_COL_W = 46;
const COURT_GAP = 8;
const COURT_W = (W - PAD * 2 - TIME_COL_W - COURT_GAP) / 2;
const ROW_H = (H - GRID_Y - PAD) / CALENDAR_ROWS;

const COURT_X: Record<Court, number> = COURT_ID_LIST.reduce(
	(acc, court, index) => {
		acc[court] = PAD + TIME_COL_W + index * (COURT_W + COURT_GAP);
		return acc;
	},
	{} as Record<Court, number>
);
const FULL_COURT_W = COURT_W * 2 + COURT_GAP;

const FONT = 'Montserrat, system-ui, sans-serif';

function mixWithTransparent(color: string, percent: number): string {
	return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

function getThemeColors() {
	const style = getComputedStyle(document.documentElement);
	const get = (prop: string) => style.getPropertyValue(prop).trim();

	const text = get('--c--main--text');

	return {
		bg: get('--c--main--background'),
		text,
		textLight: mixWithTransparent(text, 55),
		bookingBg: get('--c--booking--background'),
		bookingText: get('--c--booking--text'),
		gridLine: mixWithTransparent(text, 15),
		suggestionBg: get('--c--suggestion--background'),
		suggestionBorder: get('--c--suggestion--border'),
		suggestionText: get('--c--suggestion--text')
	};
}

export async function generateShareImage(params: {
	date: Temporal.PlainDate;
	bookings: Booking[];
	suggestion: TimeSuggestion;
}): Promise<Blob> {
	const { date, bookings, suggestion } = params;
	const colors = getThemeColors();

	await Promise.all(
		[400, 600, 700, 800].map((weight) => document.fonts.load(`${weight} 16px Montserrat`))
	);

	const canvas = document.createElement('canvas');
	canvas.width = W * SCALE;
	canvas.height = H * SCALE;
	const ctx = canvas.getContext('2d');
	assertNonNullish(ctx, 'Failed to get 2d canvas context');
	ctx.scale(SCALE, SCALE);

	ctx.fillStyle = colors.bg;
	ctx.fillRect(0, 0, W, H);

	// Header
	ctx.fillStyle = colors.text;
	ctx.font = `800 24px ${FONT}`;
	const dateStr = date.toLocaleString('sv-SE', {
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	});
	ctx.fillText(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), PAD, HEADER_Y + 24);

	// Column headers
	ctx.fillStyle = colors.text;
	ctx.font = `700 14px ${FONT}`;
	for (const court of COURT_ID_LIST) {
		ctx.fillText(COURT_LABEL[court], COURT_X[court] + 4, COL_HEADER_Y + 16);
	}

	// Time axis + grid lines
	for (let i = 0; i <= CALENDAR_HOURS; i++) {
		const y = GRID_Y + i * CALENDAR_ROWS_PER_HOUR * ROW_H;
		const hour = CALENDAR_START_HOUR + i;

		if (i < CALENDAR_HOURS) {
			ctx.fillStyle = colors.textLight;
			ctx.font = `600 13px ${FONT}`;
			ctx.fillText(`${hour}:00`, PAD, y + 14);
		}

		ctx.strokeStyle = colors.gridLine;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(COURT_X.a, y);
		ctx.lineTo(W - PAD, y);
		ctx.stroke();
	}

	// Draw bookings
	for (const booking of bookings) {
		const start = formattedTimeToMinutes(booking.startTimeFormatted);
		const end = formattedTimeToMinutes(booking.endTimeFormatted);
		if (start < CALENDAR_START_MINUTES || end > CALENDAR_END_MINUTES) continue;

		const startRow = minutesToRowIndex(start);
		const endRow = minutesToRowIndex(end);

		let x: number, w: number;
		const halfCourt = COURT_ID_LIST.find(
			(court) => COURT_RESOURCE_ID[court] === booking.resourceId
		);
		if (halfCourt) {
			x = COURT_X[halfCourt];
			w = COURT_W;
		} else if (booking.resourceId === fullCourtId) {
			x = COURT_X.a;
			w = FULL_COURT_W;
		} else {
			continue;
		}

		const by = GRID_Y + startRow * ROW_H + 1;
		const bh = (endRow - startRow) * ROW_H - 2;

		ctx.fillStyle = colors.bookingBg;
		roundRect(ctx, x + 2, by, w - 4, bh, SLOT_RADIUS);
		ctx.fill();

		ctx.fillStyle = colors.bookingText;
		if (booking.bookedBy) {
			ctx.font = `600 13px ${FONT}`;
			ctx.fillText(booking.bookedBy, x + 8, by + 17, w - 16);
		}
		ctx.font = `400 12px ${FONT}`;
		ctx.fillText(
			`${print24HourTime(start)} – ${print24HourTime(end)}`,
			x + 8,
			by + (booking.bookedBy ? 32 : 17),
			w - 16
		);
	}

	// Draw suggestion
	{
		const startRow = minutesToRowIndex(suggestion.startMinutes);
		const endRow = minutesToRowIndex(suggestion.startMinutes + suggestion.durationMinutes);
		const x = COURT_X[suggestion.court];
		const w = COURT_W;
		const sy = GRID_Y + startRow * ROW_H + 1;
		const sh = (endRow - startRow) * ROW_H - 2;

		ctx.fillStyle = colors.suggestionBg;
		roundRect(ctx, x + 2, sy, w - 4, sh, SLOT_RADIUS);
		ctx.fill();

		ctx.strokeStyle = colors.suggestionBorder;
		ctx.lineWidth = 2;
		ctx.setLineDash([5, 3]);
		roundRect(ctx, x + 2, sy, w - 4, sh, SLOT_RADIUS);
		ctx.stroke();
		ctx.setLineDash([]);

		ctx.fillStyle = colors.suggestionText;
		ctx.font = `700 15px ${FONT}`;
		ctx.fillText('Spela här?', x + 8, sy + 20, w - 16);
		ctx.font = `400 13px ${FONT}`;
		ctx.fillText(
			`${print24HourTime(suggestion.startMinutes)} – ${print24HourTime(suggestion.startMinutes + suggestion.durationMinutes)}`,
			x + 8,
			sy + 38,
			w - 16
		);
	}

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode share image'))),
			'image/png'
		);
	});
}

function roundRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number
) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}
