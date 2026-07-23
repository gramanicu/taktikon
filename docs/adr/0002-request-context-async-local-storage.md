# ADR-0002 — Request context via AsyncLocalStorage

**Status:** accepted · **Date:** 2026-07-23

## Context

Cross-cutting, request-scoped values (request id now; authenticated principal and a
trace-correlated logger later) need to be readable deep in the call chain — inside
services and repositories — without threading Hono's `Context` (or a bespoke context
object) through every function signature.

## Decision

Use Node's `AsyncLocalStorage` (`node:async_hooks`) for a request-scoped context.

- A `requestContextMiddleware` runs each request inside `runWithRequestContext(...)`,
  seeding an `x-request-id` (from the incoming header or a fresh `randomUUID()`) and
  echoing it back as a response header.
- `requestContext()` reads the active store. It **throws** if called outside a request
  scope — using request state with no request in flight is a programmer error, not a
  recoverable one (so it asserts rather than returning a `Result`).
- Handlers keep their typed `c: Context` for their *own* validated input
  (`c.req.valid(...)` stays statically typed from the route). ALS is only for
  cross-cutting state below the handler.
- Lives in `apps/api/src/lib/request-context.ts`. The `RequestContext` type grows
  (principal at Phase 4 auth, logger at the observability phase).

## Consequences

- Fully Node-supported; the same primitive OpenTelemetry uses for in-process context
  propagation (cross-process still travels via the W3C `traceparent` header).
- One caveat, made explicit: `getStore()` is `undefined` outside a scope, so the reader
  guards and throws a clear error. No typing loss for the stored value itself.
- Slightly implicit (context is ambient), so it is reserved for genuinely cross-cutting
  request state — never to hide a handler's own inputs.
