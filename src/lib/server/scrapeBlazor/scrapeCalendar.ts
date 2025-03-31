import type { Booking } from '$lib/types';
import { withBrowserAndPage } from './getBrowser';
import { waitUntilPageIsLoaded } from './step1WaitUntilPageIsLoaded';
import { searchForSorgenfri } from './step2SearchForSorgenfri';
import { selectDayView } from './step3SelectDayView';
import { selectTargetDate } from './step4SelectTargetDate';
import { scrapeAllBookings } from './step5ScrapeBookings';

const baseUrl = 'https://malmo.rbok.se/boka-resurser';

export async function scrapeCalendar(targetDate: Date): Promise<Booking[]> {
	console.log('Scraping blazor calendar...');
	console.log('Target date:', targetDate.toISOString());

	const allBookings = await withBrowserAndPage<Booking[]>(
		{
			defaultViewport: { width: 1200, height: 1024 },
			headless: true
		},
		async (browser, page) => {
			console.log('Navigating to URL:', baseUrl);
			await page.goto(`${baseUrl}`);

			await waitUntilPageIsLoaded(page);
			await searchForSorgenfri(page);
			await selectDayView(page);
			await selectTargetDate(page, targetDate);

			return scrapeAllBookings(page);
		}
	);

	console.log('Finished scraping calendar');
	console.log(allBookings);

	return allBookings;
}
