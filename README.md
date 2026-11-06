# Debate Platform

Structured PRO and CONTRA debate platform. This repository contains the MVP
foundation (M0): monorepo, shared packages, API contract, authentication wiring,
PostgreSQL persistence, web shell, worker scheduler and deployment tooling.

## Stack

- **Monorepo:** moonrepo + pnpm workspaces
- **Frontend:** Vite 8 + React 19 + TanStack Router + TanStack Query + Tailwind CSS 4
- **UI:** shadcn/ui packaged as `@app/components`
- **Backend:** Hono + oRPC + Better Auth + Drizzle ORM
- **Database:** PostgreSQL 17
- **Validation:** Zod
- **Testing:** Vitest + React Testing Library + Playwright
- **Deploy:** Docker (VPS/self-host) and Cloudflare Workers (api, web assets, cron worker)

## Repository layout

```text
apps/
  api/        Hono + oRPC API (Cloudflare Worker + Node entry)
  web/        Vite SPA (Cloudflare Workers Assets + nginx image)
  worker/     Scheduled jobs (Cloudflare Cron Trigger + local loop)
  api-e2e/    API/contract/database integration tests
  web-e2e/    Playwright smoke tests
packages/
  api-contract/  Shared oRPC contract and Zod schemas
  api-client/    Typed oRPC client + TanStack Query utils
  database/      Drizzle schema, dual driver and transactions
  auth/          Better Auth configuration
  env/           Validated environment schemas
  shared/        Result, domain errors, ids, pagination, clock
  permissions/   Shared permission catalogue
  messages/      UI copy catalogue
  components/    shadcn/ui design system
  logger/        Structured JSON logger
  config/        Shared TypeScript presets
```

## Quick start

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/worker/.env.example apps/worker/.env

make services      # postgres + mailpit
make db-generate   # only when the schema changed
make db-migrate
make dev           # api :3001 + web :5173
```

Open `http://localhost:5173` — the landing page shows the live API/database health.

## Common commands

| Command | Description |
|---|---|
| `make services` | Start local Postgres and Mailpit |
| `make dev` | Run API and web on the host |
| `make db-migrate` | Apply Drizzle migrations |
| `make db-seed` | Create a demo user |
| `make check` | Biome check |
| `make arch` | Architecture boundary checks |
| `make typecheck` | TypeScript across all projects |
| `make test` | Unit/integration tests |
| `make build` | Typecheck/build all projects |
| `make up` | Build and start the full Docker stack |
| `make down` | Stop the full Docker stack |
| `make image` | Build the production API/worker image |

## shadcn/ui as a package

All primitives live in `packages/components` (`@app/components`). Import them by
subpath:

```tsx
import { Button } from "@app/components/ui/button";
import { Card, CardContent } from "@app/components/ui/card";
```

Add a new primitive with the CLI pointed at the package:

```bash
pnpm dlx shadcn@latest add dialog -c packages/components
```

`apps/web/src/styles.css` imports `@app/components/theme.css` and scans the
package through `@source "../../../packages/components"`. Never copy primitives
into `apps/web`; only feature composition belongs there.

## Environment

- `apps/api/.env` — `DATABASE_URL`, `BETTER_AUTH_*`, `WEB_ORIGIN`, `LOG_LEVEL`
- `apps/web/.env` — `VITE_API_URL` (empty = same-origin `/rpc`)
- `apps/worker/.env` — `DATABASE_URL`, `LOG_LEVEL`
- `.env.docker.example` — full Docker stack
- `.env.cloudflare.example` — Cloudflare Workers values

Environment parsing lives in `@app/env` and fails fast on missing/invalid values.

## Docker

```bash
cp .env.docker.example .env.docker
docker compose up -d --build   # postgres, migrate, api, worker, web (nginx)
```

- API: `http://localhost:3001`
- Web: `http://localhost:8080`
- Mailpit: `http://localhost:8026`

Local development ports: Postgres `5434`, Mailpit `1026`/`8026`, Redis `6381`
(optional `cache` profile), API `3001`, web `5173`.

The web container proxies `/rpc` and `/api` to the API, so browser auth cookies
stay same-origin.

## Cloudflare Workers

- `apps/api` — Worker (`src/worker.ts`, `nodejs_compat`), Neon serverless driver
- `apps/web` — Workers Assets with SPA fallback
- `apps/worker` — Cron Trigger every minute

```bash
pnpm --filter @app/api deploy:dry-run
pnpm --filter @app/web deploy:dry-run
pnpm --filter @app/worker deploy:dry-run
```

Live deploy requires `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, a Neon
`DATABASE_URL`, and `wrangler secret put` values. See
[`docs/deployment/cloudflare.md`](docs/deployment/cloudflare.md).

## M0 scope

- Monorepo/tooling and strict TypeScript
- `@app/components` shadcn package
- Contract-first `health.check` and `auth.getSession`
- Better Auth + Drizzle baseline (users, sessions, accounts, verifications, profiles)
- Web shell with live health status
- Worker scheduler skeleton
- Docker dev/full stack and Cloudflare Workers configuration

Domain modules (rooms, membership, assignment, execution, voting, results,
moderation) follow in M1–M7 as vertical slices.

## End-to-end tests

```bash
pnpm --filter @app/web-e2e exec playwright install chromium
pnpm --filter @app/web-e2e test:e2e
```

The smoke test expects the web app on `http://localhost:5173` (or set
`E2E_BASE_URL`).
