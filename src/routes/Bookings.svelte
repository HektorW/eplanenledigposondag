<script>
  import { dateStrToMinutes, print24HourTime } from '$lib/utils'

  /**
   * @typedef {import('$lib/types').TimeSlot} TimeSlot
   * @typedef {import('$lib/types').CalendarEntry} CalendarEntry
   * 
   */

  /** @type {TimeSlot[] | CalendarEntry[]} */
  export let bookings

  /** @type {string} */
  export let column

  /**
   * @param {TimeSlot | CalendarEntry} item
   */
  function getMinutes(item) {
    if ('StartMinut' in item) {
      return {
        start: item.StartMinut,
        end: item.SlutMinut
      }
    }

    return {
      start: dateStrToMinutes(item.Start),
      end: dateStrToMinutes(item.End)
    }
  }
</script>

{#each bookings as item}
  {@const minutes = getMinutes(item)}
  {@const startRow = (minutes.start / 15) - 35}
  {@const endRow = (minutes.end / 15) - 35}

  <div
    class="cell"
    style:grid-column={column}
    style:grid-row={`${startRow} / ${endRow}`}
  >
    <div class="time">
      {print24HourTime(minutes.start)} - {print24HourTime(minutes.end)}
    </div>

    {#if 'BokadAv' in item}
      <div class="name">{item.BokadAv}</div>
    {/if}
  </div>
{/each}

<style>
  .cell {
    background-color: var(--grid-booked);
    border: 1px solid var(--border-color);
    padding: 0.5em;
  }

  .time {
    font-size: 1.1em;
    font-weight: bold;
  }

  .name {
    margin-block-start: 0.15em;
  }
</style>