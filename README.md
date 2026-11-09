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

## Demo data

```bash
make db-seed
```

The seed is idempotent and creates:

| Email | Role | Purpose |
|---|---|---|
| `demo@example.com` | USER | Host of all seeded rooms |
| `aisha@example.com` | USER | PRO participant (completed + voting rooms) |
| `budi@example.com` | USER | CONTRA participant (completed + voting rooms) |
| `citra@example.com` | USER | Spectator/voter and reporter |
| `moderator@example.com` | MODERATOR | Moderation queue reviewer |
| `admin@example.com` | ADMIN | Full moderation actions |

All demo accounts use `DemoPassword123!` (override with `SEED_PASSWORD`; the host
email uses `SEED_EMAIL`). Seeded rooms cover every lifecycle state: completed
with results, in-progress with round 1 in voting, published and accepting
members, a draft and a cancelled room. Three moderation reports are included
(two pending, one dismissed). The seeded moderator/admin must enable two-factor
authentication from `/profile` before the moderation queue and audit log become
accessible.

## Common commands

| Command | Description |
|---|---|
| `make services` | Start local Postgres and Mailpit |
| `make dev` | Run API and web on the host |
| `make db-migrate` | Apply Drizzle migrations |
| `make db-seed` | Seed demo users, rooms, votes and reports |
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
# required: production rejects the placeholder secret
# BETTER_AUTH_SECRET=$(openssl rand -hex 32)
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

## M1 scope (identity)

- Sign-up, sign-in and sign-out pages
- Session-aware header with protected `/profile` route
- `users.getProfile` / `users.updateProfile` with lazy profile creation
- Profile fields: display name, username, bio, avatar URL
- Display name kept in sync with the Better Auth user record
- Playwright coverage for registration, profile update, sign-out and invalid credentials

## M2 scope (debate rooms)

- `debate_rooms` table and migration with team size, rounds, submission/voting
  windows and spectator-voting configuration
- Room lifecycle: `DRAFT → PUBLISHED → CANCELLED` (start/complete reserved for
  later milestones)
- `rooms.list`, `rooms.get`, `rooms.create`, `rooms.update`, `rooms.publish`
  and `rooms.cancel` in the oRPC contract
- Host-only mutations; drafts are hidden from other users
- Explore page with published rooms, protected My Debates list, create and edit
  forms, and a public room detail page
- Unit, contract and Playwright coverage for create/edit/publish/cancel flows

Domain modules (membership, assignment, execution, voting, results, moderation)
follow in M3–M7 as vertical slices.

## M3 scope (membership)

- `room_memberships` table (`PARTICIPANT` / `SPECTATOR`, `team` reserved for M4)
- Join/leave endpoints: `memberships.join`, `memberships.leave`,
  `memberships.list`
- Participants capped at `teamSize × 2`; spectators are unlimited
- Only published/in-progress rooms accept members; hosts cannot join or leave
- Room detail now includes participant/spectator counts and the viewer role
- Members roster on the room page with join/leave actions, plus a Joined
  Debates section on My Debates
- Unit and Playwright coverage for join, leave, counts, capacity guards and
  anonymous roster visibility

## M4 scope (team assignment)

- `debate_rooms.assignment_finalized_at` and team counts on the room detail
- `assignments.autoAssign`, `assignments.setTeam`, `assignments.finalize`
- Balanced auto-assignment that fills the team with fewer members first and
  respects `teamSize` per side
- Host-only manual PRO/CONTRA overrides and clearing a team
- Finalization requires both teams to be full and balanced, then locks joining,
  leaving and further team changes
- Room page shows PRO/CONTRA slots, assignment controls for the host and the
  viewer's own team after finalization
- Unit, contract and Playwright coverage for auto-assign, finalization and the
  post-finalization lock

## M5 scope (debate execution)

- `debate_rounds` and `round_submissions` tables
- `rounds.list`, `rounds.start`, `rounds.advance`,
  `submissions.create`, `submissions.list`
- Starting requires finalized teams; the first round opens with a submission
  deadline
- One immutable argument per participant per round, enforced inside the
  submission window
- Hosts can advance once everyone submitted or the deadline passed; the worker
  cron closes expired rounds and opens the next one
- Submissions are visible to the host/author until the round closes, then to
  everyone
- Room page shows the round timeline, deadlines, submission form and arguments
- Unit, contract and Playwright coverage for start, submit, visibility and
  round advancement

## M6 scope (voting)

- `round_votes` table and a per-round `voting_deadline`/`VOTING` phase
- `votes.cast` and `votes.summary`
- Eligibility: the host always votes; spectators vote when
  `spectatorVotingEnabled` is on; participants are rejected
- One vote per voter per round (`DUPLICATE_VOTE`), with hidden totals until the
  round closes (hosts see live totals)
- Worker transitions `OPEN → VOTING` at the submission deadline and
  `VOTING → CLOSED` at the voting deadline, then opens the next round
- Room UI shows the voting panel, eligibility, own vote and revealed tallies
- Unit, contract and Playwright coverage for spectator voting, hidden results
  and closing the voting phase

## M7 scope (results & moderation)

- `round_results` and `room_results` with `PRO`/`CONTRA`/`DRAW` outcomes
- `results.getRoom`, `results.finalizeRound`, `results.finalizeRoom`
- Round results require a closed round with at least one vote; the room result
  requires every round to be closed and finalized, then marks the room
  `COMPLETED`
- `content_reports` with categories, statuses and moderator resolution notes
- `reports.create`, `reports.list`, `reports.resolve`
- Reports are visible to `MODERATOR` roles and resolvable by roles with
  `MODERATION_ACTION` (admins); resolution happens once
- Room UI gains a results panel and a report form; protected moderation queue at
  `/moderation`
- Unit, contract and Playwright coverage for finalization and report submission

All planned domain slices (M2–M7) are now implemented.

## Hardening

### Rate limits

- `/rpc/*` is limited per authenticated `userId`, falling back to the trusted
  client IP for anonymous requests, with `RATE_LIMIT_RPC_PER_MINUTE`
  (default 120/min). RPC limits run after session resolution so rotating cookies
  cannot create new buckets.
- `/api/auth/*` is limited per trusted client IP with
  `RATE_LIMIT_AUTH_PER_MINUTE` (default 60/min).
- Client IPs come from `CF-Connecting-IP` in Cloudflare mode, otherwise from
  nginx `X-Real-IP` / the last `X-Forwarded-For` hop. The first
  `X-Forwarded-For` value is never trusted.
- Responses include `x-ratelimit-limit`, `x-ratelimit-remaining` and
  `x-ratelimit-reset`; rejected requests return `429` with `retry-after` and a
  structured `RATE_LIMITED` body.
- The default limiter is in-memory (fine for one Node instance). Set
  `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to share limits across
  instances and Cloudflare isolates. Cloudflare production refuses to start
  without Upstash; other production deployments log a warning.

### Request limits and headers

- RPC bodies are capped at 256 KB and auth bodies at 64 KB (`413
  PAYLOAD_TOO_LARGE`). The Node server enforces 10s header, 30s request and 5s
  keep-alive timeouts.
- The API sends CSP (`default-src 'none'`), `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, HSTS in
  production and a restrictive `Permissions-Policy`.
- The nginx image and the Cloudflare `_headers` file send CSP, HSTS,
  clickjacking, MIME-sniffing, referrer and permissions headers for the SPA.
- Browser mutations on `/rpc/*` must come from `WEB_ORIGIN` (Origin/Referer
  guard); requests without browser origin headers remain available to CLI and
  server clients.
- `GET /metrics` requires `Authorization: Bearer $METRICS_TOKEN` when the token
  is set, and is disabled in production when no token is configured.

### Authentication hardening

- Password policy is 12–128 characters.
- Email verification is sent on signup; verification is enforced in production
  when `RESEND_API_KEY` is configured.
- Password reset (`/forgot-password`, `/reset-password`) and password change
  (`/profile`) are available; changing a password revokes other sessions, and a
  "Sign out other devices" action is provided.
- Two-factor authentication (TOTP + backup codes) is available from the profile
  security card; login prompts for the authenticator code when enabled.
  Moderators/admins must enable it before using moderation or the audit log.
- Users can download their data (`/api/me/export`) and delete their account
  from the profile page.
- Admins with MFA can browse the immutable audit log at `/audit`.
- Reset/verification emails are sent with Resend (`RESEND_API_KEY`,
  `EMAIL_FROM`). Without a provider key, development logs delivery locally and
  production logs a warning.
- Login redirects only accept same-site paths, preventing open redirects.

### Logging and audit

- Error logs are redacted (`redactError`): SQL params, pg `detail`, messages,
  emails and sensitive object keys are removed while keeping codes, constraints
  and stack frames.
- Security-sensitive actions are written to `audit_events`: room publish/cancel,
  assignment finalization, round start/advance, round/room result finalization
  and report resolution.

### Privacy and retention

- `/api/me/export` returns the authenticated user's profile, hosted rooms,
  memberships, submissions, votes, reports and notifications as JSON.
- Account deletion is self-service with password confirmation; foreign keys
  cascade owned data.
- Worker retention defaults: read notifications 90 days, resolved reports 365
  days, audit events 730 days. Override with
  `NOTIFICATION_RETENTION_DAYS`, `REPORT_RETENTION_DAYS` and
  `AUDIT_RETENTION_DAYS`.

### Supply chain and database roles

- `pnpm audit --prod`, gitleaks and CodeQL run in `.github/workflows/security.yml`.
- The esbuild advisory is pinned out via a workspace override.
- Migrations can use `MIGRATION_DATABASE_URL` with an owner role while the API
  runtime uses a least-privilege `DATABASE_URL`.

### Production guards

- `make db-seed` refuses to run with `NODE_ENV=production` unless
  `SEED_ALLOW_PRODUCTION=true`, and then requires an explicit `SEED_PASSWORD`.
  The seed never logs passwords.
- Production startup rejects placeholder `BETTER_AUTH_SECRET` values; Cloudflare
  deployments additionally require `https` for `BETTER_AUTH_URL` and
  `WEB_ORIGIN`.

### Notifications

- In-app notifications are stored in `notifications` and exposed through
  `notifications.list`, `notifications.markRead` and `notifications.markAllRead`.
- Events: member joined (host), teams finalized, debate started, round voting
  opened, new round opened (API and worker), round result, debate completed and
  report resolved.
- The header shows an unread count and `/notifications` lists, links and marks
  notifications as read.

### Observability

- Every request is logged as structured JSON with `requestId`, method, path,
  route, status and duration (`http.request`); health/metrics endpoints log at
  debug level.
- Responses include `x-request-id`; unhandled errors keep the same id.
- `GET /metrics` exposes Prometheus text metrics:
  `http_requests_total`, request duration sum/count, and
  `rate_limit_rejections_total`.
- The web root has an error boundary so API failures render a clear message
  instead of an uncaught route error.

## End-to-end tests

```bash
# HTTP integration tests: runs migrations, starts the API on :3101 and cleans up
DATABASE_URL=postgresql://app:app@localhost:5434/app pnpm --filter @app/api-e2e test

# Playwright: starts the API (:3001) and web app (:5173) automatically
pnpm --filter @app/web-e2e exec playwright install chromium
pnpm --filter @app/web-e2e test:e2e
```

The API integration suite exercises health, auth/session, profiles, rooms,
membership, assignments, execution, voting, results, notifications, moderation,
audit and privacy export over real HTTP. It is skipped when `DATABASE_URL` is
not set.

Playwright reuses a running API/web server when available. Set `E2E_BASE_URL` to
point at an already deployed environment and skip the local servers entirely.

CI runs both suites in the `End-to-end` job with a PostgreSQL service. The
Playwright suite is no longer executed only manually.
