# ADR-0007 — Feature flags

**Status:** accepted · **Date:** 2026-07-24

## Decision

- **OpenFeature** (`@openfeature/server-sdk`) is the vendor-neutral interface the code
  writes against — the transferable, industry-standard skill; providers swap without code
  changes. `lib/flags.ts` exposes `initFlags(provider)`, `flags()`, and `isEnabled(...)`.
- **Default provider: InMemory** — flags resolve to their in-code defaults in dev and
  tests (no external dependency).
- **Backend: Unleash.** No official OpenFeature *server* Unleash provider exists, so
  `lib/unleash-provider.ts` wraps Unleash's official `unleash-client` in a minimal
  OpenFeature provider (boolean flags via `isEnabled`; variant flags fall back to the
  default for now). Wired at the composition root when `UNLEASH_URL` + `UNLEASH_TOKEN` are
  set; otherwise the InMemory default is used.
- Unleash + its Postgres run behind the **`flags` Docker Compose profile**
  (`docker compose --profile flags up`), started on demand; images pinned.
- Feature flags — not branches — gate what each environment sees.

## Consequences

- OpenFeature verified via InMemory unit tests; the Unleash provider is typechecked and the
  `flags` compose profile validated, but the live Unleash path isn't spun up here (needs the
  running server + an API token) — pins may need a bump on first pull.
- The app runs in dev without Unleash; flags simply return their defaults.
