# Operator Template

The Voyant template for tour operators. A single Cloudflare Worker that serves the `/v1/*` API and SSR dashboard, with a Hatchet background worker for durable tasks.

## Stack

- **Runtime**: Cloudflare Workers (Vite + `@cloudflare/vite-plugin`)
- **Framework**: TanStack Start + React 19
- **UI**: Local shadcn copy + Tailwind CSS v4
- **DB**: PostgreSQL via Hyperdrive (Neon recommended)
- **Auth**: Better Auth
- **Jobs**: Hatchet

## Quick start

```bash
pnpm -F operator dev          # Cloudflare Worker + SSR
pnpm -F operator dev:worker   # Hatchet background worker
```

Dev server runs on port `3300`.

## Database

The template owns its `drizzle.config.ts` and `migrations/`:

```bash
pnpm -F operator db:generate   # generate new migration from schema changes
pnpm -F operator db:migrate    # apply migrations
pnpm -F operator db:push       # push schema directly (dev only)
pnpm -F operator db:studio     # open Drizzle Studio
```

## Deploy

```bash
pnpm -F operator build
pnpm -F operator deploy
```

## Routes

- `/v1/admin/*` — staff-facing API (requires `staff` actor)
- `/v1/public/*` — customer/partner/supplier API
- `/api/auth/*` — Better Auth handler
- `/*` — TanStack Start SSR dashboard

## License

FSL-1.1-Apache-2.0
