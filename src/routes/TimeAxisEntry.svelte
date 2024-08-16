<script lang="ts">
	import type { ParsedWeatherTimeEntry } from "$lib/types";
  
  export let hour: number

  export let sundayWeatherEntries: ParsedWeatherTimeEntry[]

  const weatherEntry = sundayWeatherEntries
    .find((entry) => entry.date.getHours() === hour)
</script>

<div>
  <div class="hour">{hour}:00</div>

  {#if weatherEntry}
    {@const iconName = weatherEntry.data.next_1_hours?.summary?.symbol_code ?? weatherEntry.data.next_6_hours.summary?.symbol_code}
    {@const temperature = weatherEntry.data.instant.details?.air_temperature}

    <div class="weather">
      {#if iconName}
        <img src="weather-icons/{iconName}.png" alt={iconName} title={iconName} />
      {/if}
      
      {#if temperature}
        <span class="temperature">{temperature.toFixed(1)}°</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .hour {
    font-size: 1.25em;
    font-weight: bold;
  }

  .weather {
    align-items: center;
    display: flex;
    justify-content: space-between;
  }

  .weather img {
    height: 1em;
    width: 1em;
  }

  .weather .temperature {
    font-size: 0.8em;
  }
</style>