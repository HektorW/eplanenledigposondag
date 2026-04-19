import { describe, it, expect } from 'vitest';
import { buildLoadingMessageList } from './loadingMessages';

describe('buildLoadingMessageList', () => {
	it('always starts with the search message', () => {
		const result = buildLoadingMessageList(null);
		expect(result[0]).toBe('Letar efter lediga tider...');
	});

	it('always ends with the restart markers', () => {
		const result = buildLoadingMessageList(null);
		const lastTwo = result.slice(-2);
		expect(lastTwo[0]).toBe('Nu har jag inte fler texter \u{1F643}');
		expect(lastTwo[1]).toBe('Vi börjar om \u{1F978}');
	});

	it('includes weather message with image when symbol and label are available', () => {
		const result = buildLoadingMessageList({
			middayWeatherSymbol: 'clearsky_day',
			middayWeatherLabel: 'sol'
		});

		const weatherMessage = result.find(
			(msg): msg is { text: string; imageUrl: string } => typeof msg === 'object' && 'text' in msg
		);

		expect(weatherMessage).toBeDefined();
		expect(weatherMessage!.text).toBe('Ser ut att bli sol');
		expect(weatherMessage!.imageUrl).toBe('/weather-icons/clearsky_day.png');
	});

	it('includes weather text message when label exists but symbol is null', () => {
		const result = buildLoadingMessageList({
			middayWeatherSymbol: null,
			middayWeatherLabel: 'sol'
		});

		expect(result).toContain('Ser ut att bli sol');
	});

	it('does not produce "null" in weather text when symbol exists but label is null', () => {
		const result = buildLoadingMessageList({
			middayWeatherSymbol: 'unknown_code',
			middayWeatherLabel: null
		});

		const weatherMessages = result.filter(
			(msg) =>
				(typeof msg === 'string' && msg.includes('Ser ut att bli')) ||
				(typeof msg === 'object' && 'text' in msg && msg.text.includes('Ser ut att bli'))
		);

		for (const msg of weatherMessages) {
			const text = typeof msg === 'string' ? msg : msg.text;
			expect(text).not.toContain('null');
		}
	});

	it('does not include weather message when both symbol and label are null', () => {
		const result = buildLoadingMessageList({
			middayWeatherSymbol: null,
			middayWeatherLabel: null
		});

		const weatherMessages = result.filter(
			(msg) =>
				(typeof msg === 'string' && msg.startsWith('Ser ut att bli')) ||
				(typeof msg === 'object' && 'text' in msg && msg.text.startsWith('Ser ut att bli'))
		);

		expect(weatherMessages).toHaveLength(0);
	});

	it('does not include weather message when weather is null', () => {
		const result = buildLoadingMessageList(null);

		const weatherMessages = result.filter(
			(msg) =>
				(typeof msg === 'string' && msg.startsWith('Ser ut att bli')) ||
				(typeof msg === 'object' && 'text' in msg && msg.text.startsWith('Ser ut att bli'))
		);

		expect(weatherMessages).toHaveLength(0);
	});

	it('returns only string and {text, imageUrl} message types', () => {
		const result = buildLoadingMessageList({
			middayWeatherSymbol: 'rain',
			middayWeatherLabel: 'regn'
		});

		for (const msg of result) {
			if (typeof msg === 'string') continue;
			expect(msg).toHaveProperty('text');
			expect(msg).toHaveProperty('imageUrl');
			expect(typeof msg.text).toBe('string');
			expect(typeof msg.imageUrl).toBe('string');
		}
	});
});
