# ADR-0001 — Decorator-based route layer

**Status:** accepted · **Date:** 2026-07-23

## Context

Routes need an ergonomic, declarative authoring style and reusable API concerns
(validation, OpenAPI responses, guards). The sibling `arke` project specced a decorator
layer ("hono-kit") but never implemented it, so its claim that the approach works on an
esbuild toolchain was unverified.

## Decision

Adopt **TC39 Stage 3 (standard) decorators** for HTTP routes. Explicitly:

- **No** `experimentalDecorators`, **no** `emitDecoratorMetadata`, **no** `reflect-metadata`.
- Decorator metadata is stored on `Symbol.metadata`, polyfilled once
  (`Symbol.metadata ??= Symbol('Symbol.metadata')`) before any decorated class evaluates.
- Decorators: `@Controller(basePath)`, `@Get/@Post/@Put/@Patch/@Delete(path)`,
  `@Params/@Query/@Body(zodSchema)`, `@Produces(status, zodSchema, description?)`,
  `@UseGuard(...guards)` (usable on class or method).
- Guards are plain `(c) => Response | undefined` functions run before the handler; no
  guard interface, no `canActivate`.
- An explicit `register(app, Controller, instance)` reads the metadata and, per method,
  builds a `@hono/zod-openapi` `createRoute(...)` and calls `app.openapi(route, handler)`.
  DI stays explicit — the instance is constructed by the caller and passed in.
- Two handler styles, chosen per handler: **return-based** (preferred — omit `Context`,
  read input via typed ALS accessors `params`/`query`/`body`, `return` plain data which
  `register` serializes at the first declared 2xx status) and an **escape hatch** (take
  `c: Context`, return a `Response`). Typed `Result → status` mapping arrives with the
  error-handling layer.
- Lives in `apps/api/src/kit/` for now; extract to `packages/hono-kit` when a second
  Hono service exists.

## Consequences

- Works on our single-runtime toolchain: `tsx` (dev) and `tsup` (build) both transpile
  Stage 3 decorators + `Symbol.metadata` via esbuild ≥ 0.21.3 (we run 0.28). Verified
  empirically on Node 24 (spike + the `HealthController` end-to-end: the generated
  OpenAPI spec carries a `#/components/schemas/HealthResponse` ref).
- No runtime reflection; wiring errors are compile-time, not boot-time.
- The `register` glue uses a few localized type casts at the `createRoute`/`app.openapi`
  boundary — isolated to the one kit file; route authors never see them.
- Zod remains the single source of truth; decorators only carry the schemas.
