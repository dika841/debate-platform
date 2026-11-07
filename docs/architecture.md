# Architecture (M0 baseline)

## Monorepo boundaries

```text
apps/web      → UI only. Consumes @app/api-client. Never imports backend packages.
apps/api      → Hono + oRPC. Owns use cases, authorization and transactions.
apps/worker   → Scheduled jobs. Reuses @app/database, never imports apps/api.
packages/*    → Shared building blocks with a single direction of dependency.
```

Dependency direction:

```text
apps/web ──► api-client ──► api-contract
    │
    └────► components, messages, permissions

apps/api ──► auth, database, env, shared, logger, permissions
apps/worker ─► database, env, shared, logger
```

`pnpm --filter @app/api arch` enforces two rules:

1. `apps/api/src/modules/**/domain/**` must not import Hono, oRPC, Drizzle, Zod or HTTP/database platform code.
2. `apps/web` must not import `@app/database`, `@app/auth` or `@app/api`.

## Backend module layout

Each bounded context follows the same four layers:

```text
apps/api/src/modules/<context>/
├── domain/           entities, value objects, policies, ports
├── application/      use cases, DTOs, mappers
├── infrastructure/   Drizzle repositories, adapters
└── presentation/     oRPC procedures and transport schemas
```

Planned contexts: identity, debate-room, membership, team-assignment,
debate-execution, voting, results, moderation, notification.

M0 implemented the identity baseline (Better Auth + profiles). M1 adds the
identity module:

```text
apps/api/src/modules/identity/
├── domain/profile.ts                 username/display name/bio validation
├── application/
│   ├── ports/profile-repository.ts
│   ├── use-cases/get-profile.ts
│   ├── use-cases/update-profile.ts
│   └── mappers/user-profile-mapper.ts
├── infrastructure/persistence/drizzle-profile-repository.ts
└── presentation/users-router.ts      oRPC procedures
```

Profiles are created lazily on first read, so pre-existing Better Auth users do
not need a backfill migration. Updating `displayName` also updates the Better
Auth user name to keep the session header consistent.

M2 adds the debate-room context as the first domain slice:

```text
apps/api/src/modules/debate-room/
├── domain/room.ts                    configuration validation and lifecycle
├── application/
│   ├── ports/room-repository.ts
│   ├── room-access.ts                load + host authorization
│   ├── use-cases/{create,get,list,update,publish,cancel}-room.ts
│   └── mappers/room-mapper.ts
├── infrastructure/persistence/drizzle-room-repository.ts
└── presentation/rooms-router.ts      oRPC procedures
```

Room visibility and transitions are domain rules: drafts and cancelled rooms are
only readable by the host, published rooms are public, and only drafts can be
edited. The lifecycle is `DRAFT → PUBLISHED → CANCELLED` for M2; starting and
completing debates arrive with execution and results.

Transport errors are mapped once in `platform/orpc/errors.ts`, so future
contexts share the same domain/application → HTTP status translation.

M3 adds the membership context:

```text
apps/api/src/modules/membership/
├── domain/membership.ts              joinable states, host rules, capacity
├── application/
│   ├── ports/membership-repository.ts
│   ├── use-cases/{join,leave}-room.ts
│   ├── use-cases/list-members.ts
│   └── mappers/membership-mapper.ts
├── infrastructure/persistence/drizzle-membership-repository.ts
│                                     repository + room participation reader
└── presentation/memberships-router.ts
```

Participants are capped at `teamSize × 2` (both sides) and spectators are
unlimited. The join transaction locks the room row before counting, so two
concurrent joins cannot exceed capacity. Joining is idempotent for the same
role; switching roles requires leaving first. The `team` column is intentionally
left nullable until team assignment lands in M4.

`rooms.get` composes the debate-room and membership contexts through the
`RoomParticipationReader` port, which supplies counts and the viewer role
without coupling the room domain to membership persistence.

M4 adds the team-assignment context:

```text
apps/api/src/modules/team-assignment/
├── domain/assignment.ts              editable states, team caps, balancing
├── application/
│   ├── use-cases/auto-assign-teams.ts
│   ├── use-cases/set-team.ts
│   ├── use-cases/finalize-assignments.ts
│   └── mappers/assignment-mapper.ts
└── presentation/assignments-router.ts
```

Auto-assignment greedily fills the team with fewer members first, so six
participants in a 3v3 room become 3 PRO / 3 CONTRA. Manual host overrides are
capped per team. Finalization requires both teams to be full and balanced, then
writes `assignment_finalized_at`; after that, membership joins/leaves and team
changes are rejected. The room detail exposes `teamCounts` and the viewer's own
team through the roster.

M5 adds the debate-execution context:

```text
apps/api/src/modules/debate-execution/
├── domain/round.ts                   deadlines, round state, submission rules
├── application/
│   ├── ports/{round,submission}-repository.ts
│   ├── use-cases/{start-debate,advance-round,list-rounds}.ts
│   ├── use-cases/{create-submission,list-submissions}.ts
│   └── mappers/execution-mapper.ts
├── infrastructure/persistence/drizzle-{round,submission}-repository.ts
└── presentation/rounds-router.ts
```

Starting a debate creates all configured rounds and opens the first one with a
submission deadline derived from `submissionDurationMinutes`. A participant may
submit exactly one argument per round while it is open; the unique
`(round_id, author_id)` constraint backs the domain rule. Before a round closes,
only the author and host can read its submissions; afterwards they become
public. Hosts can advance early when every participant has submitted, and the
worker `round.deadline` job closes expired rounds and opens the next PENDING one
on the Cloudflare cron / local loop.

## Frontend architecture

The frontend intentionally uses **Vite + React 19 + TanStack Router** (SPA)
instead of the Next.js recommendation in the product architecture document. This
matches the previous monorepo projects and keeps deployment as static Workers
Assets.

```text
apps/web/src/
├── routes/            file-based TanStack Router routes
│   ├── __root.tsx
│   ├── _public/       public layout + explore, room detail, auth pages
│   └── _authenticated/ protected profile, My Debates, create/edit room
├── libs/
│   ├── orpc/          typed client + TanStack Query utils
│   └── api/           query helpers
├── styles.css         Tailwind 4 entry, imports @app/components theme
└── main.tsx           QueryClient + RouterProvider
```

Rules:

- Route files compose features; they do not contain backend logic.
- Cross-cutting client utilities live in `src/libs/*`.
- Shared UI primitives live only in `@app/components` (see below).
- Feature-specific components stay next to their route until reused by another app.

## shadcn/ui package

`packages/components` (`@app/components`) is the single source of UI primitives:

```text
packages/components/
├── components.json
├── theme.css                 design tokens
└── src/
    ├── ui/                   button, card, input, dialog, table, ...
    ├── hooks/                non-business hooks
    └── lib/utils.ts          cn()
```

Consumption:

```tsx
import { Button } from "@app/components/ui/button";
import { Card, CardContent } from "@app/components/ui/card";
```

Adding a primitive:

```bash
pnpm dlx shadcn@latest add dialog -c packages/components
```

Tailwind scans the package through `@source "../../../packages/components"` in
`apps/web/src/styles.css`, and the design tokens are imported from
`@app/components/theme.css`. React is a peer dependency to avoid duplicate
instances.

## API contract

`packages/api-contract` is the only shared API surface:

- procedure definitions (`health.check`, `auth.getSession`, `users.*`, `rooms.*`)
- Zod input/output schemas
- public DTO types

`packages/api-client` creates the typed client and TanStack Query utils. The API
implements the contract with `implement(contract)` so drift becomes a type error.

## Runtime and deployment

- **Local:** Node (`apps/api/src/main.ts`) + Vite dev server, Postgres and Mailpit in Docker.
- **Docker:** API/worker image + nginx web image; nginx proxies `/rpc` and `/api`.
- **Cloudflare:** API Worker (`src/worker.ts`), static web assets, cron worker.
- **Database:** local Postgres via `pg`; Neon via `@neondatabase/serverless`.
  Driver selection is automatic based on the database host.
