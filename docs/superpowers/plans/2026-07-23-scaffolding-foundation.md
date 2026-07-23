# Taktikon Scaffolding — Implementation Plan

> **For agentic workers:** this is a scaffolding plan executed as one continuous pass with
> **direct commits to `master`** (no PRs until the first runnable instance — see
> `docs/GIT-WORKFLOW.md` and project convention). Steps use checkbox (`- [ ]`) syntax.
> Library setup is verified against current docs (Context7) at the moment each phase is
> built. This plan is **ephemeral** — retire it from `HEAD` once the scaffold lands; durable
> decisions become ADRs in `docs/adr/`.

**Goal:** Stand up the taktikon monorepo and all foundational apps/packages/infra through a
first runnable instance, per `docs/superpowers/specs/2026-07-23-scaffolding-design.md`.

**Architecture:** pnpm + Turborepo monorepo; single Node 24 runtime via `tsx`; a Hono
modular-monolith API exposing an OpenAPI contract; a generated TS client shared to a
Next.js web app and a CLI; Postgres + Drizzle + Redis; better-auth behind a port; OTEL +
Grafana LGTM; OpenFeature + Unleash; Terraform driving a local k3d cluster.

**Tech Stack:** pnpm, Turborepo, TypeScript (strict), tsx, Biome, Lefthook, commitlint,
release-please, Hono + `@hono/zod-openapi`, Zod, neverthrow, Drizzle ORM + Postgres, Redis,
better-auth, OpenTelemetry + Winston, Vitest + Testcontainers + fast-check, Playwright,
Next.js App Router + Tailwind + shadcn/ui + Storybook + TanStack Query, commander +
`@clack/prompts`, OpenFeature + Unleash, Terraform + k3d.

## Global Constraints

- **Content boundary:** all tracked identifiers/examples stay generic (`ruleset`, `unit`,
  `model`, `roster`, `collection`, `points`). No publisher/game-specific proper nouns.
- **Runtime:** Node **24 LTS**; single runtime (no Bun). `tsx` for dev; `tsup`/`esbuild` for
  builds.
- **Package manager:** pnpm (workspaces + catalog). `engines.node >= 24`.
- **I must not edit `.github/workflows`** — workflow YAML is provided here for the user to add.
- **Commits:** Conventional Commits, direct to `master` during scaffolding.
- **Conventions:** named exports only; no `enum` (`as const`); `type` over `interface`;
  `*At` timestamps; neverthrow `Result` / `node:assert`; Zod source of truth; domain files
  import no framework/infra; comments only for non-obvious *why*.

---

## Phase 1 — Monorepo foundation *(sequential; prerequisite for everything)*

**Deliverable:** wired empty monorepo; `pnpm install` + `pnpm turbo run lint typecheck test`
green; release-please + CI workflow YAML handed to the user.

**Files (create):** root `package.json`, `pnpm-workspace.yaml`, `turbo.json`,
`tsconfig.base.json`, `biome.json`, `commitlint.config.ts`, `lefthook.yml`,
`release-please-config.json`, `.release-please-manifest.json`, `.gitignore` (verify).
**Files (modify):** `.nvmrc` (`22`→`24`), `docs/ARCHITECTURE.md` (`main`→`master` typo,
line 10), promote `CLAUDE.md` provisional conventions to locked.

- [ ] Root `package.json`: private, `packageManager: pnpm@<latest>`, `engines.node>=24`,
      scripts delegate to turbo (`lint`/`typecheck`/`test`/`build`), `prepare: lefthook install`.
      devDeps: `turbo`, `@biomejs/biome`, `typescript`, `tsx`, `lefthook`,
      `@commitlint/cli`, `@commitlint/config-conventional`, `@types/node`.
- [ ] `pnpm-workspace.yaml`: `packages: [apps/*, packages/*]`; `catalog:` for shared pins
      (`typescript`, `zod`, `neverthrow`, `vitest`, `@types/node`).
- [ ] `turbo.json`: tasks `build` (`dependsOn: ["^build"]`, outputs `dist/**`),
      `typecheck` (`^typecheck`), `lint`, `test` (`^build`). (Base on arke's proven schema.)
- [ ] `tsconfig.base.json`: strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
      `verbatimModuleSyntax`, `isolatedModules`, ES2022, `moduleResolution: bundler`, no
      decorators. (Base on arke.)
- [ ] `biome.json`: 2-space, lineWidth 100, single quotes, trailing commas all, semicolons
      as-needed, `noDefaultExport: error`, organize-imports on. (Base on arke.)
- [ ] `commitlint.config.ts` extends `config-conventional`.
- [ ] `lefthook.yml`: `commit-msg`→commitlint; `pre-commit`→Biome + `turbo run typecheck`.
- [ ] release-please: `release-please-config.json` (`node-workspace` plugin; packages added
      per phase) + `.release-please-manifest.json`. **Provide** `release-please.yml`
      workflow (action `@v4`, `config-file`+`manifest-file`, on push to `master`) for user.
- [ ] **Provide** `ci.yml` (Node 24 + pnpm; jobs: biome, typecheck, vitest) and
      `pr-title.yml` (commitlint PR-title lint) YAML for user to add under `.github/workflows/`.
- [ ] `.nvmrc` → `24`; fix `docs/ARCHITECTURE.md` line 10 `main`→`master`.
- [ ] Verify: `pnpm install` succeeds; `pnpm turbo run lint typecheck test` exits 0 (no
      packages yet = no-op green). Commit: `chore: scaffold monorepo foundation`.

## Phase 2 — API skeleton + contracts *(sequential; spine)*

**Deliverable:** `apps/api` Hono server boots; `GET /health` returns; OpenAPI spec emitted;
`packages/contracts` client generated; Vitest smoke test green.

- [ ] `apps/api`: Hono + `@hono/node-server` + `@hono/zod-openapi`; `src/env.ts` (Zod-validated),
      `src/app.ts` (build app + register module routes), `src/server.ts` (start), `src/lib/`.
- [ ] Sample module `modules/health/` in the `entity`/`vo`/`use-case` + `routes` shape (trivial),
      proving the module convention + the domain-purity rule.
- [ ] `packages/contracts`: Zod schemas + generated OpenAPI TS client (openapi-typescript or
      `@hono/zod-openapi` spec → client). Verify generation command via Context7 at build.
- [ ] Vitest unit + a health integration test. Add `apps/api` + `packages/contracts` to
      release-please config. Commit.

## Phase 3 — Data layer *(sequential; modifies api)*

**Deliverable:** Postgres + Drizzle wired; a Testcontainers integration test passes;
docker-compose base (Postgres + Redis) up; schema-drift check.

- [ ] `docker-compose.yml`: `postgres` + `redis` (base). Drizzle ORM + drizzle-kit;
      `*.table.ts` convention; `drizzle.config.ts`; migrate script (Node + `--env-file`).
- [ ] `lib/db` (postgres.js + Drizzle) and `lib/cache` (Redis client). Testcontainers
      integration test for a real query. `schema:check` script + lefthook pre-push hook. Commit.

## Phase 4 — Auth *(sequential; modifies api)*

**Deliverable:** better-auth behind `IIdentityPort`; username+password; hashed-email;
forgot-password (hash-match + transient plaintext send via `IEmailPort`); invite-only skeleton.

- [ ] `modules/identity/`: better-auth (username plugin) + drizzle adapter behind
      `identity.port.ts`; `auth.table.ts`; routes at `/api/auth`. Verify better-auth setup
      via Context7 at build.
- [ ] `IEmailPort` (no-op/console adapter for now); custom forgot-password use-case
      (hash email, match, send to transient plaintext). Simple owner/user role. Tests. Commit.

## Phase 5 — Observability + feature flags *(sequential; modifies api)*

**Deliverable:** OTEL env-gated + Winston; Grafana LGTM compose profile; OpenFeature +
Unleash wired server-side.

- [ ] `instrumentation.ts` (OTEL, preloaded via `node --import`), env kill-switch; Winston +
      OTEL transport. `infra/observability/` + compose `--profile observability`
      (otel-collector, tempo, loki, prometheus, grafana). Base on arke.
- [ ] OpenFeature SDK in api + Unleash provider; Unleash (+ its Postgres) in compose. Verify
      OpenFeature/Unleash setup via Context7 at build. Flag-gated example endpoint. Commit.

## Phase 6 — PARALLEL GROUP *(worktree-isolated agents; disjoint paths)*

Dispatch after Phase 2 (contracts) exists; each on its own git worktree, merged when green.

- [ ] **6a — Web:** `apps/web` Next.js App Router (no API routes) + Tailwind + shadcn/ui +
      `packages/ui` design system + Storybook + TanStack Query over the contracts client +
      Playwright smoke test. Verify Next/shadcn/TanStack setup via Context7.
- [ ] **6b — CLI:** `apps/cli` commander + `@clack/prompts` over the contracts client with
      bearer auth; a smoke command + test. Verify commander/clack via Context7.
- [ ] **6c — Infra:** `infra/terraform` (env `local`; `kubernetes`/`helm`/`docker` providers
      driving a local **k3d** cluster; remote-state backend scaffold). Verify terraform
      provider + k3d setup via Context7. (`google` provider deferred to hosting time.)

## First runnable instance

API boots + serves `/health` and `/api/auth`; web renders a page hitting the API through the
generated client; CLI runs one command against the API; `docker compose up` provides
Postgres + Redis (+ Unleash). At this point, switch to the normal branch/PR workflow.

---

## Self-review notes

- Every spec section (§2–§14) maps to a phase above; deferred items (§15) are intentionally
  absent.
- `.github/workflows` files are **provided, not authored by the agent**, per constraint.
- Parallelism is confined to Phase 6 (disjoint leaf paths) because the spine is a real
  dependency chain and observability/flags mutate `apps/api`.
