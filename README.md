# Taktikon

A personal toolkit for tabletop wargaming.

> **Status:** early scaffolding. Backend is TypeScript/JavaScript; the rest of the stack
> is not yet locked.

## What It Does

Three pillars:

1. **Army building** — compose army lists and validate them against a points budget.
2. **Collection tracking** — track owned models, their build/paint status, and gaps.
3. **Rules reference** — fast lookup of the rules you need mid-game.

## Documentation

| Doc | What's in it |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Entry point for contributors and AI agents: rules, workflow, boundaries |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Design direction and stack decisions (evolving) |
| [`docs/GIT-WORKFLOW.md`](./docs/GIT-WORKFLOW.md) | Trunk-based branching + feature-flag strategy |
| [`docs/GITHUB-ACCESS.md`](./docs/GITHUB-ACCESS.md) | Scoped GitHub token setup for local automation |
| [`docs/DOMAIN.md`](./docs/DOMAIN.md) | Generic domain glossary |

## Workflow at a Glance

Single release branch `master`, always releasable. Feature branches merge in via squash
PR; environment differences are gated by **feature flags**, not branches. Commits and PR
titles follow [Conventional Commits](https://www.conventionalcommits.org/). See
[`docs/GIT-WORKFLOW.md`](./docs/GIT-WORKFLOW.md).

## License

[MIT](./LICENSE) © 2026 Nicolae Grama.
