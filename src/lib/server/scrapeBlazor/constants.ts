export const texts = {
	menuItem: 'Resources',
	sorgenfriIp: 'Sorgenfri IP'
} as const;

export const selectors = {
	menuItem: 'a.rbok-menu-sub-item',
	searchInput: '#main input[placeholder="-- search --"]',
	resourceLabel: '#Resurser label'
} as const;

export const resourceAndDateRegex = /(?:7-manna (\d))?, Starts at ([^,]+), Ends at (.+)$/;
