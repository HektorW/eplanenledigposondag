import type { CalendarResponse, WeatherResponseData } from '$lib/types';
import { getNextSundayDate } from '$lib/utils';

const calendarUrl = 'https://malmo.rbok.se/KundBokaResurser/KalenderScheduler_Read';

export async function load() {
	const nextSundayDate = getNextSundayDate();
	const [dateStr] = nextSundayDate.toISOString().split('T');

	const calendarPayload = `sort=&group=&filter=&start=${dateStr}+00%3A00&slut=${dateStr}+00%3A00&resurser%5B0%5D.Id=2a34ae50-60d9-4ccb-b890-c5da9aab043e&resurser%5B0%5D.Namn=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna&resurser%5B0%5D.Beskrivning=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna&resurser%5B0%5D.Las=False&resurser%5B0%5D.Skriv=False&resurser%5B0%5D.FarBokas=False&resurser%5B1%5D.Id=19444fe5-e625-4ca8-8b4c-d699bb1dfc7d&resurser%5B1%5D.Namn=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna+%2F+7-manna+1&resurser%5B1%5D.Beskrivning=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna+%2F+7-manna+1&resurser%5B1%5D.Las=False&resurser%5B1%5D.Skriv=False&resurser%5B1%5D.FarBokas=False&resurser%5B2%5D.Id=a4204133-591e-4dad-b5be-08c94288c5ad&resurser%5B2%5D.Namn=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna+%2F+7-manna+2&resurser%5B2%5D.Beskrivning=Sorgenfri+IP+%2F+Konstgr%C3%A4s+11-manna+%2F+7-manna+2&resurser%5B2%5D.Las=False&resurser%5B2%5D.Skriv=False&resurser%5B2%5D.FarBokas=False`;

	const calendarRequest = fetch(calendarUrl, {
		method: 'POST',
		body: calendarPayload,
		headers: {
			accept: 'application/json',
			'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
		}
	});

	const weatherRequest = fetch(
		'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=55.59&lon=13.02',
		{
			headers: {
				'User-Agent': 'EPlanenLedigPoSondag/1.0 github.com/HektorW/eplanenledigposondag'
			}
		}
	);

	const [calendarResponseData, weatherResponseData] = await Promise.all([
		calendarRequest.then((response) => response.json() as Promise<CalendarResponse>),
		weatherRequest.then(
			(response) => {
				if (response.ok) {
					return response.json() as Promise<WeatherResponseData>;
				}

				return null;
			},
			() => null
		)
	]);

	return {
		date: nextSundayDate,
		calendar: calendarResponseData,
		weather: weatherResponseData
	};
}
