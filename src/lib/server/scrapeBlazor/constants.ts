export const texts = {
	menuItem: 'Resources'
} as const;

export const selectors = {
	menuItem: 'a.rbok-menu-sub-item',
	searchInput: '#main input[placeholder="-- search --"]',
	resourceLabel: '#Resurser label'
} as const;

// Half-pitch suffix is "7-manna N" on some fields and "7-spels N" on others
// (malmo.rbok.se renamed most of them in Nov 2026). No suffix = full pitch.
export const resourceAndDateRegex = /(?:7-(?:manna|spels) (\d))?, Starts at ([^,]+), Ends at (.+)$/;
