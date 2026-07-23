# CLAUDE.md — Taktikon

Guidance for AI coding agents (and humans) working in this repo. Read it before touching code.

## What This Is

Taktikon is a personal toolkit for tabletop wargaming. Three pillars:

1. **Army building** — compose and validate army lists against a points budget.
2. **Collection tracking** — track owned models, build/paint status, and gaps.
3. **Rules reference** — quick lookup of the rules a player needs mid-game.

## Project Status

Early scaffolding. The **backend is TypeScript / JavaScript**; the rest of the stack is
**not yet locked**. Anything below marked *(provisional)* describes the intended
direction — inspired by the sibling `arke` project — but is **not law** until the stack
is chosen. Do not introduce heavy tooling or architectural assumptions without
confirming first.

Keep names, examples, and identifiers **generic** (`ruleset`, `unit`, `points`,
`collection`). Project-local working notes, if present, live in `CLAUDE.local.md`.

## Git Workflow — Trunk-Based

- **One release branch: `master`.** It is always releasable.
- Feature branches (`<issue#>-<kebab-title>`) branch off `master` and PR back into `master`
  with a **squash merge**.
- **Feature flags — not long-lived branches — gate what each environment sees.**
  Unfinished work may merge to `master` behind a disabled flag rather than living on a
  branch.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`,
  `ci:`, `build:`, `perf:`, `style:`, `revert:`). PR titles are linted in CI.
- Full detail: [`docs/GIT-WORKFLOW.md`](./docs/GIT-WORKFLOW.md).

## GitHub (gh CLI)

You operate against GitHub through a fine-grained token scoped to **this repo only**
(see [`docs/GITHUB-ACCESS.md`](./docs/GITHUB-ACCESS.md)).

- **You may:** create / read / edit / close issues, manage labels and milestones, open
  and review pull requests, read CI runs.
- **You may not:** touch any other repository, force-push, or edit `.github/workflows`.
- **Project boards** are moved automatically by GitHub's built-in issue automations —
  you organise work through **issue state, labels, and milestones**, not board APIs.

## Coding Direction *(provisional — confirm before enforcing)*

- Named exports only; `type` over `interface`; `as const` objects over `enum`.
- `for...of` / `.map` / `.filter` over `.forEach`; early-return guard clauses first.
- Timestamps as an explicit date-time type with an `*At` suffix.
- Comments only when the *why* is non-obvious — never restate the code.
- Fuller conventions land here once the stack is locked. The reference philosophy lives
  in the sibling `arke` project's `CLAUDE.md`.

## Feedback Loops

Once tooling exists, every check must pass before a commit (typecheck / lint / test).
Until then this is a placeholder — **do not fabricate passing checks**; state plainly
that a check does not exist yet.
