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
