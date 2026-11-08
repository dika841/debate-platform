# Security guide

## Implemented controls

- Better Auth sessions: httpOnly cookies, `secure`/`sameSite` in production,
  7-day expiry with daily refresh, session revocation and password change.
- Password policy 12–128 characters, optional TOTP two-factor authentication
  with backup codes, email verification (production enforcement when an email
  provider is configured) and password reset.
- Role separation: `USER`, `MODERATOR` (review reports) and `ADMIN` (resolve
  reports). Roles cannot be set through signup.
- RPC authorization and visibility checks per context (room host, members,
  spectators, moderators) with tests.
- Rate limits for auth (per IP + endpoint) and RPC (per authenticated user,
  fallback IP); Cloudflare production requires Upstash Redis.
- Origin/Referer CSRF guard for `/rpc/*`, safe login redirects, request body
  limits, server timeouts and security headers (API, nginx, Cloudflare).
- Redacted error logging, request IDs, Prometheus metrics, audit events for
  security-sensitive actions.
- Seed refuses to run in production without explicit opt-in and never logs
  passwords.
- Production rejects placeholder auth secrets and requires HTTPS on Cloudflare.

## Database least privilege

Run migrations with an owner role and run the API with a DML-only role:

```sql
-- migration/owner role (MIGRATION_DATABASE_URL)
CREATE ROLE debate_migrator LOGIN PASSWORD 'replace-me';
GRANT ALL PRIVILEGES ON DATABASE app TO debate_migrator;

-- runtime role (DATABASE_URL)
CREATE ROLE debate_app LOGIN PASSWORD 'replace-me';
GRANT CONNECT ON DATABASE app TO debate_app;
GRANT USAGE ON SCHEMA public TO debate_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO debate_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO debate_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO debate_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO debate_app;
```

Set `MIGRATION_DATABASE_URL` for `make db-migrate` and keep `DATABASE_URL` in
the API/worker environment to the runtime role.

## Production checklist

- Unique `BETTER_AUTH_SECRET` (`openssl rand -hex 32`), HTTPS URLs.
- Upstash Redis configured (mandatory for Cloudflare, recommended for any
  multi-instance deployment).
- Resend key and verified sender domain; verify email enforcement expectations.
- `METRICS_TOKEN` set and `/metrics` reachable only by monitoring.
- Cloudflare origin locked to Cloudflare IPs or authenticated origin pulls.
- Database backups, TLS (`sslmode=require`), least-privilege runtime role.
- Never run `make db-seed` against production.
- Enable 2FA for every admin/moderator account.
- Add WAF/bot protection in front of signup if abuse is observed.

## Known follow-ups

- MFA is enforced for moderation and audit access; any future admin-only
  capability must call `requireTwoFactor`.
- Email delivery requires an external provider (Resend); Mailpit is receive-only.
- CSP is strict and may need tuning if new third-party assets are introduced.
- WAF rules are documented in the Cloudflare guide but must be created in the
  dashboard/Terraform for each zone.
