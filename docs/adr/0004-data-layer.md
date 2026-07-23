# ADR-0004 — Data layer

**Status:** accepted · **Date:** 2026-07-24

## Context

We need a relational store and a cache, plus integration tests that exercise real
services — without making the default test gate (and CI) require Docker.

## Decision

- **PostgreSQL** via **Drizzle ORM** + the **postgres.js** driver; **Redis** via **ioredis**.
- `createDb(connectionString)` / `createCache(url)` are **factories taking an explicit
  connection string** — no env coupling, so they're trivially testable (tests pass a
  container URL; bootstrap will pass `env.DATABASE_URL` / `env.REDIS_URL`).
- Schema is co-located per module as `*.table.ts`; migrations generate via **drizzle-kit**
  into `db/migrations`, applied by a standalone `db/migrate.ts` runner.
- Integration tests use **Testcontainers** (real Postgres/Redis). Vitest is split into two
  projects: **`unit`** (the default `test`, no external deps) and **`integration`**
  (`test:integration`, needs Docker). So the default gate / CI stay Docker-free; the
  Docker-dependent tests are opt-in.
- `docker-compose.yml` provides Postgres + Redis for local dev (`pnpm infra:up`).
- **No TimescaleDB.**

## Consequences

- `pnpm turbo run test` (and CI) never needs Docker; `pnpm --filter @taktikon/api
  test:integration` runs the real-service tests when Docker is available (verified: SELECT
  1 on Postgres 17, round-trip on Redis 7).
- `drizzle-kit generate` errors with "no schema files" until the first `*.table.ts` exists
  — expected while the domain is unmodeled.
- `env.DATABASE_URL` / `env.REDIS_URL` are optional until a module wires the DB, so the
  health app still boots without them.
