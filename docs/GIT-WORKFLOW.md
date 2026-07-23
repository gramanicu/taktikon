# Git Workflow — Trunk-Based

Taktikon uses a **single release branch** with feature flags, not a multi-branch
GitFlow. This keeps history linear, avoids long-lived divergence, and lets unfinished
work ship (dark) without blocking releases.

## The Branch

- **`master` is the one long-lived branch.** It is always in a releasable state.
- Every environment (local, staging, production) deploys from `master`. Differences
  between environments come from **feature flags and configuration**, never from
  different branches.

## Feature Branches

1. Branch off `master`: `git switch -c <issue#>-<kebab-title>` (e.g. `42-army-points-cap`).
2. Do the work. Keep the branch short-lived (hours to a few days).
3. Open a PR into `master`.
4. CI must be green and the PR title must follow Conventional Commits.
5. **Squash merge.** The squashed commit message is the meaningful unit of history.
6. Delete the branch after merge.

## Feature Flags

Because everything merges into one branch, **incomplete or risky work merges behind a
disabled flag** rather than living on a branch:

- New behaviour is wrapped in a flag that defaults **off**.
- Environments opt in by enabling the flag in their config.
- Once a feature is proven everywhere, remove the flag and the dead branch of code.

This is what makes trunk-based development safe: `master` is always shippable because
unfinished paths are simply not reachable in environments that haven't enabled them.

## Commits & PR Titles

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add points-budget validation to army builder
fix: correct unit count when duplicating a roster
chore: bump toolchain
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `ci`, `build`,
`perf`, `style`, `revert`. PR titles are checked by `.github/workflows/pr-title.yml`.

## Releases

Cut releases from `master` (tag `vX.Y.Z`). Since `master` is always releasable, a release is
a tag + deploy, not a merge dance.

## Hotfixes

A hotfix is just a short feature branch off `master` with a `fix:` PR — no separate
long-lived branch, no cherry-picking between release lines.

## Specs & Decision Records

Planning specs are **ephemeral**; decision records are **permanent and lean**.

- **Specs** (`docs/superpowers/specs/`) capture a design while it's being built. They are
  working artifacts: keep them only through the review + implementation cycle, then remove
  them from `HEAD` once the work has landed. Git history still holds them.
- **ADRs** (`docs/adr/`) are the durable record — one decision per file, a few lines each,
  written as each piece is implemented (not all upfront). This is what future contributors
  read.

The goal is a small, maintained permanent doc set. Uncurated specs that are never pruned
rot into misleading noise, so prune them.
