# Cloudflare Workers deployment

The repository deploys three Workers, mirroring the `hris-management-ts` setup.

| App | Config | Domain (default) |
|---|---|---|
| `apps/api` | `wrangler.jsonc` | `api-debate.randika.dev` |
| `apps/web` | `wrangler.jsonc` | `debate.randika.dev` |
| `apps/worker` | `wrangler.jsonc` | cron trigger only |

## 1. Prerequisites

```bash
pnpm install
pnpm --filter @app/api exec wrangler login
```

Set the Cloudflare account id in each `wrangler.jsonc` if it differs from the
current one.

## 2. Neon PostgreSQL

Create a Neon project and copy the pooled connection string:

```text
postgresql://user:password@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
```

`@app/database` automatically switches to `@neondatabase/serverless` for any
non-local host, so the same code runs locally against Docker Postgres and in the
Worker against Neon.

## 3. Secrets

```bash
pnpm --filter @app/api exec wrangler secret put DATABASE_URL
pnpm --filter @app/api exec wrangler secret put BETTER_AUTH_SECRET
pnpm --filter @app/api exec wrangler secret put WEB_ORIGIN
```

Non-secret vars (`NODE_ENV`, `BETTER_AUTH_URL`, `WEB_ORIGIN`, `CLOUDFLARE`) live
in `apps/api/wrangler.jsonc`.

Generate the auth secret with `openssl rand -hex 32`.

## 4. Migrations

Run migrations from CI or your machine against Neon:

```bash
DATABASE_URL="postgresql://..." pnpm --filter @app/api migrate
```

The API Worker never runs migrations at request time.

## 5. Deploy

```bash
pnpm --filter @app/api deploy
VITE_API_URL=https://api-debate.randika.dev pnpm --filter @app/web deploy
pnpm --filter @app/worker deploy
```

`deploy:dry-run` validates bundling without publishing:

```bash
pnpm --filter @app/api deploy:dry-run
pnpm --filter @app/web deploy:dry-run
pnpm --filter @app/worker deploy:dry-run
```

## 6. GitHub Actions

`deploy.yml` runs tests, applies migrations and deploys the matrix. Required
repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `VITE_API_URL` (variable, defaults to the API domain)

## 7. Cookies and CORS

Web and API are separate subdomains, so `apps/api` sets:

```ts
sameSite: "none";
secure: true;
```

`WEB_ORIGIN` must exactly match the web origin, and `trustedOrigins` includes
both the production web origin and `http://localhost:5173`.

For the Docker stack, nginx proxies `/rpc` and `/api`, keeping cookies
same-origin and avoiding third-party cookie restrictions.
