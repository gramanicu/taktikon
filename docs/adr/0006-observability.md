# ADR-0006 — Observability

**Status:** accepted · **Date:** 2026-07-24

## Decision

- **Full OpenTelemetry** (traces + metrics + logs) in `src/instrumentation.ts`, preloaded
  via `node --import` (prod `start`; `dev:otel` for dev) so auto-instrumentation patches
  http/pg/ioredis before they load.
- **Off by default**, opt in with **`OTEL_ENABLED=true`** — the file no-ops otherwise, so
  local dev and the test gate are unaffected. Endpoint/sampling come from standard `OTEL_*`
  env vars.
- **Winston** JSON logging (`lib/logger.ts`) with `@opentelemetry/winston-transport` for
  trace-correlated logs (a no-op when OTEL is off).
- **Grafana LGTM stack** — OTEL Collector → Tempo (traces) / Loki (logs) / Prometheus
  (metrics) + Grafana — behind the **`observability` Docker Compose profile**
  (`docker compose --profile observability up`), started on demand. Images are pinned (not
  `:latest`).

## Consequences

- OTEL code verified by typecheck + load smoke (on and off); compose profile validated via
  `docker compose config`. The full stack is intentionally not spun up in CI (heavy) — pins
  may need a bump on first pull.
- `instrumentation.ts` reads `process.env` directly — the one documented exception to the
  env boundary, since it runs before config loads.
