# ADR-0003 — Generated API client (`packages/contracts`)

**Status:** accepted · **Date:** 2026-07-23

## Context

`web` and `cli` need a typed client for the API, derived from the single OpenAPI contract
(Zod is the source of truth; the API emits `openapi.json`). We also want the committed
tree to stay lean (no large generated blobs in `HEAD`).

## Decision

- **Hey API** (`@hey-api/openapi-ts`, v0.99) generates a typed fetch client + SDK + types
  from the API's `openapi.json` into `packages/contracts/src/generated/`.
- Both `apps/api/openapi.json` and `packages/contracts/src/generated/` are **gitignored**
  and regenerated via `pnpm gen`. Turbo orders it: `contracts#generate` depends on
  `@taktikon/api#gen:openapi`; `typecheck`/`build` depend on `^build`.
- `contracts` **builds to `dist/`** with tsup (bundled ESM + `.d.ts`) and is consumed via
  its built output. So consumers import declarations — `skipLibCheck` skips them and they
  never re-typecheck the generated internals under our strict flags.
- The generated code needs looser settings than our hand-written code
  (`exactOptionalPropertyTypes: false`, `lib` includes `DOM` for Fetch types); these are
  confined to the `contracts` tsconfig and don't leak past the built `.d.ts`.
- The **universal fetch client** is used (not `@hey-api/client-next`) because `contracts`
  is shared by `cli` and `web`; base URL is set by consumers via `client.setConfig(...)`.

## Consequences

- Committed LOC stays hand-written; a fresh checkout or CI runs `pnpm gen` first.
- Contract changes surface by regenerating; a schema-drift check can be added later.
- No `transpilePackages` needed in Next — it imports plain built JS.
