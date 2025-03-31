<script lang="ts">
	import type { ParsedWeatherTimeEntry } from '$lib/types';

	type TimeAxisProps = {
		weatherEntries: ParsedWeatherTimeEntry[];
	};

	const { weatherEntries }: TimeAxisProps = $props();

	const hours = 10;
	const startHour = 9;
</script>

{#each { length: hours } as _, index}
	{@const hour = startHour + index}
	{@const weatherEntry = weatherEntries.find((entry) => entry.date.getHours() === hour)}

	<div class="time-axis-entry" style:grid-row="{2 + index * 4} / span 4">
		<div class="hour-container">
			<div class="hour">
				{hour}<small>:00</small>
			</div>

			{#if weatherEntry}
				{@const iconName =
					weatherEntry.data.next_1_hours?.summary?.symbol_code ??
					weatherEntry.data.next_6_hours?.summary?.symbol_code ??
					null}
				{@const temperature = weatherEntry.data.instant?.details?.air_temperature ?? null}
				{@const precipitationAmount = weatherEntry.data.next_1_hours?.details?.precipitation_amount}
				{@const precipitationMin =
					weatherEntry.data.next_1_hours?.details?.precipitation_amount_min ?? 0}
				{@const precipitationMax =
					weatherEntry.data.next_1_hours?.details?.precipitation_amount_max ?? 0.4}

				<div class="weather">
					{#if iconName}
						<img src="weather-icons/{iconName}.png" alt={iconName} title={iconName} />
					{/if}

					{#if temperature}
						<div class="temperature">{temperature.toFixed(1)}°</div>
					{/if}

					{#if precipitationMax}
						<div class="precipitation">{precipitationMin}-{precipitationMax} mm</div>
					{:else if precipitationAmount}
						<div class="precipitation">{precipitationAmount} mm</div>
					{/if}
				</div>
			{/if}
		</div>

		<div class="hour-line"></div>
	</div>
{/each}

<style lang="scss">
	.time-axis-entry {
		grid-column: 1 / -1;

		margin-top: var(--line--offset);

		display: grid;
		grid-template-columns: subgrid;

		.hour-container {
			margin-top: -0.75em;

			.hour {
				font-weight: 600;

				small {
					font-size: 0.75em;
				}
			}

			.weather {
				align-items: center;
				display: flex;
				flex-wrap: wrap;
				opacity: 0.5;

				img {
					--size: 1.25rem;

					height: var(--size);
					width: var(--size);
				}

				.temperature {
					font-size: 0.6rem;
					font-weight: 400;
				}

				.precipitation {
					flex-basis: 100%;
					font-size: 0.45em;
				}
			}
		}

		.hour-line {
			--offset--left: 0.75rem;

			grid-column: 2 / -1;

			background-color: var(--c--grid--line);
			border-radius: 2px;
			height: 2px;
			margin-left: calc(var(--offset--left) * -1);
			width: calc(100% + var(--offset--left));
		}
	}
</style>
