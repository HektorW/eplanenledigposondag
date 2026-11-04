import type { FieldId } from '$lib/fields';

export type FieldScrapeConfig = {
	/**
	 * Typed into the resource search. The search ANDs whitespace-separated
	 * substrings; there is no phrase or exclusion syntax. It may hit other
	 * fields' resources too — `labelText` picks ours out of the results.
	 * Match on "kon" (Konstgräs), not "manna": the half-pitch suffix varies
	 * between "7-manna" and "7-spels" across fields.
	 */
	searchTerm: string;
	/**
	 * Text every resource label for this field contains — and no other label
	 * in the search results does.
	 */
	labelText: string;
	/** Number of resource labels to select (e.g. full pitch + halves). */
	labelCount: number;
};

// Every field so far has the same layout — an 11-spels pitch plus "7-spels 1"
// and "7-spels 2" halves (some fields still say "7-manna") — so booking parsing (resourceAndDateRegex +
// getResourceIdFromIndex) is shared. A field with a different layout needs
// its own parsing here.
const fullPitchWithTwoHalves = { labelCount: 3 } as const;

export const FIELD_SCRAPE_CONFIG: Record<FieldId, FieldScrapeConfig> = {
	sorgenfri: {
		searchTerm: 'sor kon',
		labelText: 'Sorgenfri IP',
		...fullPitchWithTwoHalves
	},
	mellanheden: {
		searchTerm: 'mell kon',
		labelText: 'Mellanhedens IP',
		...fullPitchWithTwoHalves
	},
	dalhem: {
		searchTerm: 'dalh kon',
		labelText: 'Dalhems IP',
		...fullPitchWithTwoHalves
	},
	rosengard: {
		searchTerm: 'ros ip kon',
		// Search also returns Rosengårds Norra IP's resources. Those labels read
		// "Rosengårds Norra IP / …", so they don't contain this text.
		labelText: 'Rosengårds IP',
		...fullPitchWithTwoHalves
	}
};
