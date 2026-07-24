# ADR-0008 — Privacy-first email + password reset

**Status:** accepted · **Date:** 2026-07-24 · Completes the reset flow deferred in ADR-0005.

## Decision

- **Register** (`POST /api/identity/register`) stores the email only as a **peppered HMAC
  hash** (`emailHash`) and sets `user.email` to a **synthetic** value
  (`<username>@users.taktikon.invalid`). Login is by username; the real address is never
  persisted.
- **Forgot-password** (`POST /api/identity/forgot-password`, always `202`): look up the
  user by username, compare `hashEmail(submitted)` to the stored `emailHash`. On a match,
  trigger better-auth's own `requestPasswordReset` against the synthetic email **inside a
  request-scoped stash** (`reset-email-context`) holding the plaintext; better-auth's
  `sendResetPassword` reads that stash and delivers the reset link to the real address via
  `IEmailPort`. No user enumeration (identical response either way).
- **Reset** uses better-auth's built-in reset endpoint + token — no custom token table, no
  `admin.setUserPassword`. Authenticated change-password is better-auth's built-in.
- `IEmailPort` (console adapter for dev, logs the link); `EMAIL_HASH_PEPPER` gates the
  feature. Registration/forgot are decorated controller routes (dogfooding the http kit).

## Consequences

- Verified end-to-end against real Postgres: register → forgot (wrong email = silent; right
  email = link to plaintext) → reset via the emailed token → login with the new password.
- better-auth's default reset URL is path-based (`/api/auth/reset-password/<token>`); the
  web reset page reads the token from the path.
- The plaintext email exists only for the duration of the forgot-password request.
