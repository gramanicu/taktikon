# Taktikon — Foundational Scaffolding Design

> **Status:** proposed — awaiting review.
> **Date:** 2026-07-23.
> **Scope:** the monorepo, stack, tooling, and conventions that everything else is built
> on. Business/domain feature design (what an army *is*, how datacards render, etc.) is
> **out of scope** here and gets its own specs later.

This design borrows heavily from the sibling `arke` project's engineering philosophy,
but deliberately slims it: taktikon is a private, single-owner, invite-only personal
toolkit, not a multi-tenant platform or a reusable template. Where arke's complexity
serves goals taktikon does not have (portability, multi-tenancy, org/RBAC), we drop it.

All identifiers and examples stay generic per the project's content boundary. Domain
terms used below (`ruleset`, `unit`, `model`, `roster`, `collection`, `points`) are the
ones defined in [`DOMAIN.md`](../../DOMAIN.md).

---

## 1. Decisions at a glance

| Area | Decision | Relative to arke |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | adopt |
| Runtime | Node 24 LTS + `tsx` (single runtime) | changed (arke: Bun dev + Node prod) |
| Lint/format | Biome | adopt |
| Git hooks | Lefthook + commitlint (Conventional Commits) | adopt |
| Release | release-please | changed (arke: Changesets + RC/staging flow) |
| API | Hono + `@hono/zod-openapi` | adopt |
| API contract | zod-openapi spec + generated TS client | adopt |
| Validation | Zod (single source of truth) | adopt |
| Errors | neverthrow `Result` (expected) / `node:assert` (programmer) | adopt |
| DB | PostgreSQL 17 + Drizzle ORM + drizzle-kit | adopt (drop Timescale) |
| Cache | Redis | adopt (arke had it in infra; we use it early) |
| Auth | better-auth behind a port; username + password; hashed email | adapt (drop org/RBAC) |
| Feature flags | OpenFeature SDK + Unleash (self-hosted OSS) | new |
| Observability | Full OTEL (env-gated) + Winston; Grafana LGTM behind a profile | adopt (env kill-switch) |
| Frontend | Next.js App Router (no API routes) | new (arke has none) |
| UI | Tailwind + shadcn/ui; own design system + Storybook | new |
| CLI | commander + `@clack/prompts` (user-facing) | new (arke CLI = scaffolder stub) |
| IaC | Terraform driving local k3d now; GCP (`google` provider) later | new |
| Testing | Vitest + Testcontainers + fast-check; Playwright E2E | adopt + add E2E |
| Architecture | domain-first modules, 3-concept vocabulary, deepen per module | slimmed |
| Discarded | Timescale, Zitadel dual-auth, org/RBAC multi-tenancy, RC/staging flow, Changesets | — |

---

## 2. Repository layout

Flat `apps/` layout (simpler than arke's nested `apps/agon/api`), since taktikon is one
product.

```
apps/
  api/          Hono modular monolith (all backend domain logic)
  web/          Next.js App Router (pure frontend; no API routes)
  cli/          user-facing CLI (commander + @clack/prompts)
packages/
  contracts/    Zod schemas + generated OpenAPI TS client (consumed by web + cli)
  ui/           design system: shadcn components + tokens + Storybook (consumed by web)
infra/
  terraform/    IaC (HCL) — local k3d now, GCP later
  observability/  OTEL collector + Grafana LGTM config (compose profile)
docker-compose.yml
turbo.json  biome.json  tsconfig.base.json  lefthook.yml  commitlint.config.ts
```

Shared TS/Biome config lives at the **root** (like arke), not as packages. Backend domain
logic never leaves `apps/api`; `web` and `cli` only ever touch `packages/contracts`.

Future (deferred) apps/packages: `apps/worker` (async jobs — datacard/PDF render, exports),
satellite services (extracted auth, Discord integration, data ingest), `packages/kit`
(shared Hono utilities, extracted only once patterns stabilize).

---

## 3. Backend architecture — `apps/api`

### 3.1 Framework & contract
- **Hono** + `@hono/node-server`, OpenAPI via **`@hono/zod-openapi`**.
- **Zod is the single source of truth.** The OpenAPI spec is auto-generated; a typed TS
  client is generated from it into `packages/contracts` for `web` and `cli` to consume.
- No Hono RPC, no tRPC, no GraphQL — the OpenAPI spec is the contract, which keeps the
  door open for external/non-TS integrations later.

### 3.2 The module model (domain-first, small vocabulary)

The app is organized by **business area**, not by technical layer. Each area is a
**module** (`collection`, `roster`, `ruleset`, `identity`, …). Inside a module, code is
named for what it *is in the business*, using **three concepts** — nothing more until a
module earns it:

- **Entity** (`*.entity.ts`) — a business thing tracked by identity over time
  (`Roster`, `Model`, `Unit`). Two rosters with identical units are still two different
  rosters. Holds its own rules.
- **Value Object** (`*.vo.ts`) — a business thing that *is* just its values;
  interchangeable, replaced not mutated (`Points`, `BuildStatus`). Two `Points(500)` are
  the same thing.
- **Use Case** (`*.use-case.ts`) — a business verb spanning entities
  (`buildRoster`, `importCollection`, `validateRoster`).

Everything else in a module is **plumbing at the edge**, named for its mechanism because
that is what it is:

- `*.routes.ts` — Hono routes (HTTP in/out).
- `*.repo.ts` — persistence (Drizzle).
- `*.table.ts` — Drizzle table definition.

Example:

```
apps/api/src/modules/roster/
  roster.entity.ts        Roster: identity + rules      (business)
  points.vo.ts            Points value object           (business)
  build-roster.use-case.ts business verb                (business)
  roster.routes.ts        HTTP                          (edge)
  roster.repo.ts          persistence (Drizzle)         (edge)
  roster.table.ts         table definition              (edge)
```

**The one enabling rule:** domain files (`entity`/`vo`/`use-case`) import **no Hono and no
Drizzle** — they are pure business logic. This is what keeps the app testable and makes
later depth cheap.

### 3.3 Growing depth per module

We use the **official DDD names** from day one (`entity`/`vo`/`use-case`), so deepening a
module later is **purely additive — no renames ever**. When a specific module earns it:

- add `*.aggregate.ts` when several entities must stay consistent together;
- add `*.event.ts` when modules need to react to each other;
- split application vs domain services when logic separates.

DDD depth is **per module**: a complex core module (`roster`, `ruleset` engine) may grow
aggregates and events, while a simple CRUD module (`collection`) stays at the 3-concept
floor forever. There is no whole-app migration.

### 3.4 Wiring, errors, boundaries
- **Explicit wiring**, no IoC container / no decorators / no reflect-metadata. One place
  (`app.ts`) builds the app and registers each module's routes; dependencies are passed
  in via plain functions. TypeScript validates the graph at compile time.
- **`neverthrow` `Result<T, DomainError>`** for expected runtime conditions (bad input,
  missing data); **`node:assert`** for programmer errors (invariants internal code
  guarantees).
- **Ports** (`*.port.ts`) only for genuinely swappable externals: **auth provider**,
  **email sender**, **feature-flag client**. Not for everything.
- **Branded types** used *sparingly* — for IDs where a mix-up would bite — via `to<Brand>`
  validators, not `as` casts. Not applied dogmatically.
- **Env** read and Zod-validated in exactly one file (`env.ts`); the rest of the app
  receives config, never reads `process.env` (the OTEL `instrumentation.ts` preload is the
  one documented exception, since it runs before the module graph).

---

## 4. Authentication

- **Invite-only, multi-user, single-owner.** No org/RBAC multi-tenancy (arke's is designed
  but unbuilt; taktikon does not need it). A simple owner/user role flag is enough.
- **Login is username + password** (better-auth username plugin), not email.
- **Email is privacy-first:**
  - collected at registration, **stored as a hash only** — never persisted in plaintext;
  - **change-password** while logged in is an ordinary in-app action (no email involved);
  - **forgot-password** is the only flow that touches email: the user re-supplies their
    email, the API hashes it and matches the stored hash, then sends a reset link to the
    address the user just typed. The plaintext exists only for that request and is never
    stored.
  - a separate, explicit, opt-in **notification email** (plaintext, distinct purpose) may
    be added later for users who want email notifications.
- **better-auth sits behind an `IIdentityPort`**; only one adapter file imports it, so the
  provider is swappable. The custom username/hashed-email/reset behavior is built on
  better-auth primitives.
- **Email sending is behind an `IEmailPort`.** The concrete provider (SMTP / Resend /
  Postmark) is chosen later; the port is scaffolded now.
- Auth lives **embedded in the monolith** for now, port-isolated so it can be extracted to
  a standalone auth service later (for audit isolation) at low cost, if that ever earns its
  keep.

---

## 5. Frontend — `apps/web`

- **Next.js App Router**, used purely as a frontend. **No Next API routes** — all data
  comes from `apps/api` via the generated `packages/contracts` client. A thin proxy layer
  may be added later so the API can be IP-allowlisted to the Next deployment.
- **Tailwind + shadcn/ui.** We build our own **design system** in `packages/ui`
  (components + tokens) with **Storybook**. Actual visual design is informed by *Refactoring
  UI* and handled in a later design pass.
- **Data fetching:** TanStack Query over the generated client. Bearer-token auth.

---

## 6. CLI — `apps/cli`

User-facing CLI built on **commander** (arg/command parsing) + **`@clack/prompts`**
(interactive prompts/spinners), consuming the generated `packages/contracts` client with
bearer-token auth. Likely the first client integrated end-to-end.

---

## 7. Shared packages

- **`packages/contracts`** — Zod schemas shared with the API + the generated OpenAPI TS
  client. The only thing that crosses the backend/frontend boundary (DTOs, not domain).
- **`packages/ui`** — the design system (shadcn components, tokens, Storybook).

Domain logic is **not** shared — it stays inside `apps/api`.

---

## 8. Data layer

- **PostgreSQL 17** via **Drizzle ORM** + **drizzle-kit**.
- Schema co-located per module as `*.table.ts`; drizzle-kit globs them; migrations checked
  in. Raw-SQL migration escape hatch kept for anything Drizzle can't express.
- **Schema-drift check** in CI + as a pre-push hook.
- **Redis** for caching from the start, behind a small `lib` helper.
- **No TimescaleDB** (arke used it for leaderboards; taktikon has no such need yet).
- Seeding strategy: TBD when the first real domain data lands (ruleset content is
  user-supplied external input loaded at runtime, per `DOMAIN.md`).

---

## 9. Feature flags

- **OpenFeature** (CNCF, vendor-neutral SDK) is the interface the code writes against — a
  transferable, industry-standard skill; providers swap without code changes.
- **Provider: Unleash** (Apache-2.0, self-hosted, free). Has a management UI, backs
  GitLab's feature flags, and has an official OpenFeature provider.
- Flags are evaluated **server-side in `apps/api`** and exposed to `web` through the API;
  `web` may add a client-side OpenFeature client later if needed.
- Feature flags — not long-lived branches — gate what each environment sees (per the git
  workflow). Unfinished work can merge to `master` behind a disabled flag.

---

## 10. Observability

- **Full OpenTelemetry** (traces + metrics + logs) via a preloaded `instrumentation.ts`
  (Node `--import`). Auto-instrumentation is Node-native (a key reason we run Node, not
  Bun).
- **Single env kill-switch** (`OTEL_SDK_DISABLED`-style); **off by default locally**, flip
  on when needed.
- **Winston** logging with the OTEL Winston transport (trace correlation).
- **Grafana LGTM stack** (OTEL Collector, Tempo, Loki, Prometheus, Grafana) lives behind a
  **Docker Compose profile** and is started on demand only.

---

## 11. Infrastructure

### 11.1 Local dev — Docker Compose
- **Base services:** PostgreSQL, Redis, Unleash (+ its own Postgres).
- **`--profile observability`:** OTEL Collector, Tempo, Loki, Prometheus, Grafana.
- **Deferred:** RabbitMQ, Soketi/realtime — added when async/realtime features land.

### 11.2 Terraform — `infra/terraform`
- Terraform is adopted partly as a **learning target** (transferable to work, where GCP is
  used).
- There is **no full local GCP emulator**, so we learn real terraform mechanics by driving
  a **local k3d** (k3s-in-docker) cluster with the `kubernetes`/`helm` providers — which is
  work-representative since GCP work means **GKE**. Teaches terraform *and* Kubernetes
  together.
- Layout: environment separation (`local` now, `gcp` later) + reusable modules; remote
  state backend scaffolded (local now, GCS later).
- The `google` provider and real GCP resources (GKE / Cloud SQL / Memorystore / …) are
  added when hosting is actually chosen.

---

## 12. Testing

- **Vitest** — `unit` (`*.test.ts`) and `integration` (`*.integration.test.ts`) projects.
- **Testcontainers** (PostgreSQL) for integration tests.
- **fast-check** for property-based tests of pure domain logic.
- **Playwright** for `web` end-to-end tests.
- Philosophy: pure domain functions tested directly (no mocks); outer/use-case tests mock
  ports.

---

## 13. CI & git workflow

- **Git:** trunk-based, single **`master`** branch (always releasable). Feature branches
  `<issue#>-<kebab-title>` → squash-merge PR into `master`. Feature flags — not branches —
  gate environments. (Note: `docs/ARCHITECTURE.md` currently says `main`; the real branch
  is `master` per `CLAUDE.md` and repo state — reconcile that doc during implementation.)
- **Conventional Commits**, PR titles linted in CI.
- **CI (GitHub Actions):** PR-title lint, Biome, typecheck, Vitest, schema-drift. Playwright
  E2E optional/gated.
- **Release automation: release-please** on `master` — derives version bumps + CHANGELOG +
  tags from Conventional Commits via an auto-maintained release PR. No manual changeset
  files, no RC/staging promotion flow.
- **Git hooks (Lefthook):** commit-msg → commitlint; pre-commit → Biome + typecheck;
  pre-push → schema-drift check.

---

## 14. Coding conventions (locked)

Promotes the provisional list in `CLAUDE.md` to binding:

- Named exports only; no default exports.
- `type` over `interface` (interface only for declaration merging / extension).
- No TypeScript `enum` — `as const` object + PascalCase type alias.
- `for...of` / `.map` / `.filter` over `.forEach`; early-return guard clauses first.
- Timestamps as an explicit date-time type with an `*At` suffix.
- `neverthrow` `Result` for expected conditions; `node:assert` for programmer errors.
- Zod is the single source of truth; external strings become branded types via `to<Brand>`
  validators (sparingly), never `as` casts.
- Domain files import no framework/infrastructure.
- Comments only when the *why* is non-obvious — never restate the code, never reference
  issue/phase IDs.
- TS strict base config: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `verbatimModuleSyntax`, `isolatedModules`, ES2022, Stage-3 decorators only (no
  `experimentalDecorators` / `emitDecoratorMetadata`).

---

## 15. Deferred ideas & discarded options

### Deferred (revisit when appropriate)
- **Invite quota + audit** — users get a limited number of invites; possibly an audit trail
  of who invited whom.
- `apps/worker` and an async job/queue system (RabbitMQ) — for datacard/PDF rendering,
  exports, TTS.
- **Datacard generation + print/PDF pipeline** — a flagged priority feature; needs its own
  design.
- Satellite services: extracted auth service (audit isolation), Discord integration, data
  ingest/processing.
- Realtime (Soketi/WebSockets), notification email, `packages/kit` extraction.
- Further feature ideas (game-history tracking, narrative campaigns, paint ideas, kitbash
  supplies, "university") — each its own future spec.

### Discarded (not doing)
- **TimescaleDB** — no time-series read model need.
- **Zitadel / dual auth provider** — one provider (better-auth) is enough.
- **Org + full RBAC multi-tenancy** — single-owner app.
- **Changesets + development/staging/master RC promotion flow** — replaced by release-please
  on a single trunk.
- **Dual Bun+Node runtime** — single Node 24 runtime instead.

---

## 16. Open questions for later

- Hosting target (GCP assumed for eventual production; confirm at deploy time).
- Concrete email provider behind `IEmailPort`.
- Datacard rendering approach (HTML→PDF, print CSS, server vs client render).
- Whether/when to extract the auth service.
