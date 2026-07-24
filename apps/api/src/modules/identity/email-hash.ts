import { createHmac } from 'node:crypto'

/**
 * Builds a deterministic, peppered hash of an email. Registration stores only this hash;
 * the plaintext is never persisted. The same input always yields the same hash, so a
 * forgot-password request can be matched without ever knowing the stored address.
 */
export const makeEmailHasher =
  (pepper: string) =>
  (email: string): string =>
    createHmac('sha256', pepper).update(email.trim().toLowerCase()).digest('hex')

export type EmailHasher = ReturnType<typeof makeEmailHasher>

/** The address stored on the better-auth user record — deliberately not the real email. */
export const syntheticEmail = (username: string) => `${username}@users.taktikon.invalid`
