# ADR-0009 — Web app + design system

**Status:** accepted (setup; visual design deferred) · **Date:** 2026-07-24

## Decision

- **`apps/web`** — Next.js 16 App Router (Turbopack), a **pure frontend** (no Next API
  routes). Data flows through **TanStack Query** in client components over the built
  `@taktikon/contracts` client; the base URL is set once via `NEXT_PUBLIC_API_URL` +
  `client.setConfig`. `@taktikon/contracts` is **not** transpiled (built ESM);
  `@taktikon/ui` **is** (`transpilePackages`, raw `.tsx` source).
- **`packages/ui`** — design-system scaffold shipping raw `.tsx`: `cn()` + a `Button`
  primitive (cva + `@radix-ui/react-slot`) as a proof, with **Storybook** (`react-vite` +
  Tailwind v4 via `@tailwindcss/vite`). The actual tokens/theme/components are a later
  **design pass** (informed by *Refactoring UI*) — deliberately not designed here.
- **Tailwind v4** via `@tailwindcss/postcss` (no config file; theme in CSS `@theme` later).
- **Playwright** e2e, hermetic via route mocking (no live API needed).

## Consequences

- React deps live in the pnpm **catalog** (web + ui) to avoid dual-React skew.
- `web#typecheck` depends on `web#build` in turbo — Next generates `next-env.d.ts` +
  `.next/types` at build, which `tsc` needs.
- Biome **excludes `**/*.css`** (its parser rejects Tailwind v4's `@source`) and has
  `noDefaultExport` overrides for Next special files + stories.
- Verified: `next build`, typecheck (9/9), Biome, `build-storybook`, and Playwright e2e in
  real Chromium ("API status: ok").
