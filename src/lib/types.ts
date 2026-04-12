export type Booking = {
	bookingId: string;
	resourceId: string;

	startTimeFormatted: string;
	endTimeFormatted: string;

	bookedBy: string;
	additionalInfo?: string | null;
};

export type TimeSuggestion = {
	startMinutes: number;
	durationMinutes: number;
	court: 'a' | 'b';
};

/** @example "2024-08-15T16:00:00Z" */
export type WeatherDateStr = string;

export type WeatherEntryData = {
	summary?: {
		symbol_code: string;
	};
	details?: {
		air_pressure_at_sea_level?: number;
		air_temperature?: number;
		cloud_area_fraction?: number;
		relative_humidity?: number;
		wind_from_direction?: number;
		wind_speed?: number;
		precipitation_amount?: number;
		precipitation_amount_min?: number;
		precipitation_amount_max?: number;
	};
};

export type WeatherTimeEntry = {
	time: WeatherDateStr;
	data: {
		instant?: WeatherEntryData;
		next_12_hours?: WeatherEntryData;
		next_6_hours?: WeatherEntryData;
		next_1_hours?: WeatherEntryData;
	};
};

export type ParsedWeatherTimeEntry = WeatherTimeEntry & {
	date: Date;
};

export type WeatherResponseData = {
	properties: {
		timeseries: WeatherTimeEntry[];
	};
};
