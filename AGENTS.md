# Agent Instructions

Rules for any AI agent working in this repo.

## Pre-commit checks (required)

Always run before `git commit`:

```bash
pnpm format
pnpm lint
pnpm check
```

All three must pass. If any fail, fix root cause — do not bypass with `--no-verify`.

- `pnpm format` — Prettier write. Formats code in place.
- `pnpm lint` — ESLint. Zero errors required.
- `pnpm check` — `svelte-check` type check. Zero errors required.

## Tests

Run `pnpm test:unit` when touching `src/lib/**` logic. Skip `pnpm test:scraping` unless explicitly asked — it hits the live `malmo.rbok.se` site.

## Commit hygiene

- Stage specific files, not `git add -A`.
- Never commit secrets (`.env`, Upstash tokens).
- New commits only. No `--amend` on pushed commits.

## Package manager

pnpm 10 only. Node 24 (`engines` is pinned to `24.x` — `>=24` made Vercel build on Node 26, which `@sveltejs/adapter-vercel` rejects). Do not use npm or yarn.
