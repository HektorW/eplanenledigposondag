import {
	CALENDAR_END_MINUTES,
	CALENDAR_HOURS,
	CALENDAR_ROWS,
	CALENDAR_ROWS_PER_HOUR,
	CALENDAR_START_HOUR,
	CALENDAR_START_MINUTES,
	minutesToRowIndex
} from '$lib/calendar';
import { fullCourtId, halfCourtAId, halfCourtBId } from '$lib/ids';
import type { Booking, TimeSuggestion } from '$lib/types';
import { formattedTimeToMinutes, print24HourTime } from '$lib/utils';

const SCALE = 2;
const W = 460;
const H = 620;
const PAD = 18;

const HEADER_Y = PAD;
const HEADER_H = 56;
const COL_HEADER_Y = HEADER_Y + HEADER_H;
const COL_HEADER_H = 24;
const GRID_Y = COL_HEADER_Y + COL_HEADER_H;
const TIME_COL_W = 46;
const COURT_GAP = 8;
const COURT_W = (W - PAD * 2 - TIME_COL_W - COURT_GAP) / 2;
const COURT_A_X = PAD + TIME_COL_W;
const COURT_B_X = COURT_A_X + COURT_W + COURT_GAP;
const ROW_H = (H - GRID_Y - PAD) / CALENDAR_ROWS;

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
	date: Date;
	bookings: Booking[];
	suggestion: TimeSuggestion;
}): Promise<Blob> {
	const { date, bookings, suggestion } = params;
	const colors = getThemeColors();

	await Promise.all(
		[400, 600, 700, 900].map((weight) => document.fonts.load(`${weight} 16px Montserrat`))
	);

	const canvas = document.createElement('canvas');
	canvas.width = W * SCALE;
	canvas.height = H * SCALE;
	const ctx = canvas.getContext('2d')!;
	ctx.scale(SCALE, SCALE);

	ctx.fillStyle = colors.bg;
	ctx.fillRect(0, 0, W, H);

	// Header
	ctx.fillStyle = colors.text;
	ctx.font = `900 30px ${FONT}`;
	ctx.fillText('Söndagsboll ⚽', PAD, HEADER_Y + 30);

	ctx.fillStyle = colors.textLight;
	ctx.font = `400 16px ${FONT}`;
	const dateStr = date.toLocaleDateString('sv-SE', {
		weekday: 'long',
		day: 'numeric',
		month: 'long'
	});
	ctx.fillText(dateStr.charAt(0).toUpperCase() + dateStr.slice(1), PAD, HEADER_Y + 50);

	// Column headers
	ctx.fillStyle = colors.text;
	ctx.font = `700 14px ${FONT}`;
	ctx.fillText('Ena halvan', COURT_A_X + 4, COL_HEADER_Y + 16);
	ctx.fillText('Andra halvan', COURT_B_X + 4, COL_HEADER_Y + 16);

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
		ctx.moveTo(COURT_A_X, y);
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
		if (booking.resourceId === halfCourtAId) {
			x = COURT_A_X;
			w = COURT_W;
		} else if (booking.resourceId === halfCourtBId) {
			x = COURT_B_X;
			w = COURT_W;
		} else if (booking.resourceId === fullCourtId) {
			x = COURT_A_X;
			w = COURT_W * 2 + COURT_GAP;
		} else {
			continue;
		}

		const by = GRID_Y + startRow * ROW_H + 1;
		const bh = (endRow - startRow) * ROW_H - 2;

		ctx.fillStyle = colors.bookingBg;
		roundRect(ctx, x + 2, by, w - 4, bh, 6);
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
		const x = suggestion.court === 'a' ? COURT_A_X : COURT_B_X;
		const w = COURT_W;
		const sy = GRID_Y + startRow * ROW_H + 1;
		const sh = (endRow - startRow) * ROW_H - 2;

		ctx.fillStyle = colors.suggestionBg;
		roundRect(ctx, x + 2, sy, w - 4, sh, 6);
		ctx.fill();

		ctx.strokeStyle = colors.suggestionBorder;
		ctx.lineWidth = 2;
		ctx.setLineDash([5, 3]);
		roundRect(ctx, x + 2, sy, w - 4, sh, 6);
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
