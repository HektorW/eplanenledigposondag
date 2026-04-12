export type LoadingMessage = string | { text: string; imageUrl: string };

function shuffleGroups(groupList: LoadingMessage[][]): LoadingMessage[] {
	const shuffled = [...groupList];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled.flat();
}

// Messages that can appear in any order, early on
const anytimeGroupList: LoadingMessage[][] = [
	['Kul med fotboll ✨'],
	['Hoppas vi blir många 🤞😮‍💨'],
	['Vem tar med bollen? ⚽️'],
	['Hoppas ingen bokat hela planen 🤞'],
	['Ses på söndag? 👋']
];

// Messages that should come later — sequences stay together
const lateGroupList: LoadingMessage[][] = [
	['Tar visst lite tid 👀', 'Det är inte mitt fel 😩'],
	['Blazor var ett misstag'],
	['Malmö stad, skaffa ett API 🙏'],
	['Satans blazor 😭'],
	['Nu borde det komma något snart 🤔'],
	['Skulle jag gissa att det kommer krascha 😬']
];

export function buildLoadingMessageList(
	weather: {
		middayWeatherSymbol: string | null;
		middayWeatherLabel: string | null;
	} | null
): LoadingMessage[] {
	const weatherMessageList: LoadingMessage[] = weather?.middayWeatherSymbol
		? [
				{
					text: `Ser ut att bli ${weather.middayWeatherLabel}`,
					imageUrl: `/weather-icons/${weather.middayWeatherSymbol}.png`
				}
			]
		: weather?.middayWeatherLabel
			? [`Ser ut att bli ${weather.middayWeatherLabel}`]
			: [];

	return [
		'Letar efter lediga tider...',
		...weatherMessageList,
		...shuffleGroups(anytimeGroupList),
		...shuffleGroups(lateGroupList),
		'Nu har jag inte fler texter 🙃',
		'Vi börjar om 🥸'
	];
}
