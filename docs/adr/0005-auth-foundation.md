# ADR-0005 — Authentication foundation

**Status:** accepted (foundation; custom reset flow pending) · **Date:** 2026-07-24

## Context

Invite-only, multi-user, single-owner app. Login is by **username**, email is privacy-first
(stored only as a hash), and the auth provider must be swappable behind a port.

## Decision

- **better-auth** with the `username`, `bearer` (for the CLI), and `admin` (owner/user roles
  + a `setUserPassword` primitive) plugins, over a **Drizzle Postgres adapter**.
- It sits behind **`IIdentityPort`** (`validate(headers) → AuthContext | null`); only the
  adapter in `identity/auth.ts` imports better-auth. Swapping providers = replacing that file.
- The auth Drizzle schema is **generated** by the better-auth CLI (committed as
  `auth.table.ts`) and turned into a migration by drizzle-kit. The CLI is **not** a project
  dependency (it drags Prisma + sqlite); regenerate via `pnpm --filter @taktikon/api
  auth:generate` (dlx).
- A `user.emailHash` additional field will hold the registration email **as a hash, never
  plaintext**.
- **Composition-root DI**: `createApp(deps)` takes an optional `authHandler`; `server.ts`
  builds the auth instance from env and injects it. Unit tests build the app with no deps,
  so the default test gate stays **Docker-free**; the auth path is verified via
  Testcontainers (signup → username login → bearer validation through the port).

## Consequences

- better-auth owns the `user`/`session`/`account`/`verification` tables.
- `AUTH_SECRET` (+ optional `AUTH_URL`) join the env boundary; the server requires
  `DATABASE_URL` + `AUTH_SECRET` to boot.

## Deferred (next increment)

- Custom **register** endpoint: synthetic `user.email` + `emailHash` from the real email.
- Custom **hashed-email forgot-password**: re-supply email → hash-match → our own reset
  token → email the plaintext address via an `IEmailPort` → set the new password with
  `admin.setUserPassword`. (Not better-auth's email-lookup reset.)
- `IEmailPort` provider, and invite-quota / role gating.
