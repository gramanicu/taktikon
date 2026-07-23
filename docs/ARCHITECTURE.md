# Architecture

> **Living document.** The stack is not yet locked. This file records decisions *as they
> are made* and the direction we are leaning. Anything marked *(provisional)* is not
> binding.

## Locked Decisions

- **Backend language:** TypeScript / JavaScript.
- **Git model:** trunk-based, single `main` branch, feature-flag gated. See
  [`GIT-WORKFLOW.md`](./GIT-WORKFLOW.md).

## Under Consideration *(provisional)*

The sibling `arke` project is the reference for engineering philosophy. Ideas we may
adopt, to be confirmed as the app takes shape:

- Explicit dependency wiring over runtime DI magic.
- Domain logic kept free of infrastructure concerns.
- `Result`-style error handling for expected failures; assertions for programmer errors.
- Branded types for identities crossing the system boundary.

## Open Questions

- Runtime (Node / Bun / edge?) and web framework.
- Persistence layer and how ruleset data is loaded at runtime.
- Frontend stack (if any) and how it is packaged with the backend.
- Feature-flag provider (self-hosted config vs. a service).

_Fill these in — don't let this document lag behind real decisions._
