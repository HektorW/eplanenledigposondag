const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export type ParseTargetDateResult = {
	date: Date;
	usedFallback: boolean;
};

/**
 * Parses a date query parameter string into a Date.
 * Returns the default (next Sunday) if the param is missing or invalid.
 */
export function parseTargetDate(dateParam: string | null): ParseTargetDateResult {
	if (!dateParam) {
		return { date: getNextSundayDate(), usedFallback: false };
	}

	if (!isoDateRegex.test(dateParam)) {
		return { date: getNextSundayDate(), usedFallback: true };
	}

	const parsed = new Date(dateParam + 'T00:00:00');
	if (isNaN(parsed.getTime())) {
		return { date: getNextSundayDate(), usedFallback: true };
	}

	// Round-trip check: ensure the parsed date matches the input
	// Catches nonsense like 2026-02-30 which JS silently rolls to March
	const year = String(parsed.getFullYear()).padStart(4, '0');
	const month = String(parsed.getMonth() + 1).padStart(2, '0');
	const day = String(parsed.getDate()).padStart(2, '0');
	if (`${year}-${month}-${day}` !== dateParam) {
		return { date: getNextSundayDate(), usedFallback: true };
	}

	return { date: parsed, usedFallback: false };
}

export function print24HourTime(minutes: number): string {
	const decimal = minutes / 60;

	const formattedHours = Math.floor(decimal);
	const formattedMinutes = (decimal - formattedHours) * 60;

	return `${formattedHours}:${formattedMinutes === 0 ? '00' : formattedMinutes}`;
}

export function getNextSundayDate(fromDate = new Date()) {
	const nextSunday = new Date(fromDate);

	const sundayDayIndex = 0;
	const nextSundayAtHour = 22;
	if (fromDate.getDay() !== sundayDayIndex || fromDate.getHours() >= nextSundayAtHour) {
		nextSunday.setDate(fromDate.getDate() + (7 - fromDate.getDay()));
	}

	return nextSunday;
}

export function formattedTimeToMinutes(time: string): number {
	const [hours, minutes] = time.split(':').map(Number);
	return hours * 60 + minutes;
}

export function formatScrapedAt(isoString: string): string {
	const date = new Date(isoString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMin = Math.floor(diffMs / 60000);

	if (diffMin < 1) return 'just nu';
	if (diffMin === 1) return '1 minut sedan';
	if (diffMin < 60) return `${diffMin} minuter sedan`;

	const diffHours = Math.floor(diffMin / 60);
	if (diffHours < 24) {
		if (diffHours === 1) return '1 timme sedan';
		return `${diffHours} timmar sedan`;
	}

	const diffDays = Math.floor(diffHours / 24);
	if (diffDays === 1) return '1 dag sedan';
	return `${diffDays} dagar sedan`;
}
