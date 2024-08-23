export type TimeSlot = {
	ResursIndex: number;
	DagIndex: number;
	StartMinut: number;
	SlutMinut: number;
};

export type ReservedResponse = {
	ArbetsdagStart: number;
	ArbetsdagSlut: number;
	EjOppettider: TimeSlot[];
	ReserveradeTider: TimeSlot[];
};

/**
 * Timestamp in milliseconds
 *
 * @example "/Date(1723374000000)/"
 */
export type CalendarDateStr = string;

/** @example "#ffffff" */
export type HexStr = string;

export type CalendarEntry = {
	ActualEnd: CalendarDateStr;
	Arendenr: unknown;
	Bakgrundsfarg: HexStr;
	BokadAv: string;
	Description: string;
	End: CalendarDateStr;
	EndTimezone: unknown;
	Eventbokning: boolean;
	GrupperAsString: string;
	Id: string;
	Ikon: unknown;
	IsAllDay: boolean;
	KundTillatAvboka: boolean;
	Ovrigt: unknown;
	RecurrenceException: unknown;
	RecurrenceId: unknown;
	RecurrenceRule: unknown;
	/** Field id */
	Resurs: string;
	Start: CalendarDateStr;
	StartTimezone: unknown;
	/** Unknown meaning */
	Status: number;
	Textfarg: HexStr;
	Tillagg: boolean;
	TillaggForId: unknown;
	TillaggForResursId: unknown;
	Title: string;
	Verksamhet: string;
};

export type CalendarResponse = {
	Data: CalendarEntry[];
	Total: number;
	AggregateResults: unknown;
	Errors: unknown;
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
