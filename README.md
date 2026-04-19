# Söndagsboll ⚽️

SvelteKit app. Check if Sorgenfri football pitch free on Sunday (or next 10 days).

Scrapes `malmo.rbok.se` with Puppeteer + `@sparticuz/chromium-min`. Caches results in Upstash Redis. Overlays midday weather from met.no.

## How it works

1. `?date=YYYY-MM-DD` query param picks target date. Missing/invalid → next Sunday. Constrained to today through `MAX_FUTURE_DAYS` (10).
2. `loadBookings` reads Redis cache. Fresh (<5 min) → serve. Stale or missing → stream fresh scrape to client.
3. Scraper drives Blazor calendar in 5 steps (`src/lib/server/scrapeBlazor/step*.ts`).
4. Weather fetched in parallel from met.no locationforecast API.

## Stack

- SvelteKit 2 + Svelte 5 (runes)
- Vite 8, Vitest 4
- Puppeteer-core + chromium-min (Vercel-compatible)
- Upstash Redis (optional — falls back to in-memory Map)
- pnpm 10, Node >=24

## Dev

```bash
pnpm install
pnpm dev
```

Optional env for persistent cache:

```
UPSTASH_KV_REST_API_URL=...
UPSTASH_KV_REST_API_TOKEN=...
```

No env → in-memory cache, works fine locally.

## Scripts

| Script               | What                                 |
| -------------------- | ------------------------------------ |
| `pnpm dev`           | Vite dev server                      |
| `pnpm build`         | Production build                     |
| `pnpm preview`       | Preview prod build                   |
| `pnpm check`         | svelte-check type check              |
| `pnpm lint`          | ESLint                               |
| `pnpm format`        | Prettier write                       |
| `pnpm test`          | All vitest projects                  |
| `pnpm test:unit`     | Unit tests only                      |
| `pnpm test:scraping` | Live scraping tests (hits real site) |

## Layout

```
src/
  routes/              +page.server.ts loads data, +page.svelte renders
  lib/
    components/        Calendar, Bookings, loaders, freshness indicator
    server/
      cache.ts         Redis + memory cache with stale-while-revalidate
      scrapeBlazor/    5-step Puppeteer scraper
      weather/         met.no fetch
    utils.ts           parseTargetDate, getNextSundayDate, time formatting
    weather/           midday weather picker + labels
```

## Deploy

Vercel. `@sveltejs/adapter-auto` picks Vercel adapter. Set Upstash env vars in project settings.
