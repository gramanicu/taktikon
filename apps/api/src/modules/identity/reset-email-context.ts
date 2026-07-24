import { AsyncLocalStorage } from 'node:async_hooks'

// The forgot-password handler knows the real (plaintext) email for one request only; the
// better-auth sendResetPassword callback does not. This request-scoped stash bridges the
// two without ever persisting the address.
const storage = new AsyncLocalStorage<string>()

export const runWithResetEmail = <T>(email: string, fn: () => T): T => storage.run(email, fn)

export const currentResetEmail = (): string | undefined => storage.getStore()
