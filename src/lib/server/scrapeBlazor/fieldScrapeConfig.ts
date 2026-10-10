import type { FieldId } from '$lib/fields';

export type FieldScrapeConfig = {
	/**
	 * Typed into the resource search. Should be narrow enough to only hit this
	 * field's resources — extra searches detach already-found labels.
	 */
	searchTerm: string;
	/** Text every resource label for this field contains. */
	labelText: string;
	/**
	 * Number of resource labels to select (e.g. full pitch + halves). When
	 * omitted, every label the search returns is selected once the list settles.
	 */
	labelCount?: number;
	/** Columns the day view shows once the resources are selected. Defaults to the selected label count. */
	dayViewColumnCount?: number;
};

// Every field so far has the same layout — an 11-manna pitch plus "7-manna 1"
// and "7-manna 2" halves — so booking parsing (resourceAndDateRegex +
// getResourceIdFromIndex) is shared. A field with a different layout needs
// its own parsing here.
const fullPitchWithTwoHalves = { labelCount: 3, dayViewColumnCount: 3 } as const;

export const FIELD_SCRAPE_CONFIG: Record<FieldId, FieldScrapeConfig> = {
	sorgenfri: {
		searchTerm: 'sor man',
		labelText: 'Sorgenfri IP',
		...fullPitchWithTwoHalves
	},
	mellanheden: {
		searchTerm: 'mell man',
		labelText: 'Mellanhedens IP',
		...fullPitchWithTwoHalves
	},
	dalhem: {
		searchTerm: 'dalh ko',
		labelText: 'Dalhems IP',
		...fullPitchWithTwoHalves
	}
};
