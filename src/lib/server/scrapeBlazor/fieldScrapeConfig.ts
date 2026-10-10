import type { FieldId } from '$lib/fields';

export type FieldScrapeConfig = {
	/**
	 * Typed into the resource search. Should be narrow enough to only hit this
	 * field's resources — extra searches detach already-found labels.
	 */
	searchTerm: string;
	/** Text every resource label for this field contains. */
	labelText: string;
	/** Number of resource labels to select (e.g. full pitch + halves). */
	labelCount: number;
	/** Columns the day view shows once the resources are selected. */
	dayViewColumnCount: number;
};

// TODO: booking parsing (resourceAndDateRegex + getResourceIdFromIndex) is
// still Sorgenfri-specific. Move it in here once the other fields' labels are known.
export const FIELD_SCRAPE_CONFIG: Record<FieldId, FieldScrapeConfig> = {
	sorgenfri: {
		searchTerm: 'sor man',
		labelText: 'Sorgenfri IP',
		labelCount: 3,
		dayViewColumnCount: 3
	}
};
