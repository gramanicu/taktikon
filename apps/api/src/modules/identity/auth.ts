import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, bearer, username } from 'better-auth/plugins'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './auth.table.ts'
import type { EmailPort } from './email.port.ts'
import type { AuthContext, IdentityPort } from './identity.port.ts'
import { currentResetEmail } from './reset-email-context.ts'

export type CreateAuthOptions = {
  baseURL?: string
  emailPort?: EmailPort
}

/**
 * Builds the better-auth instance over its own Postgres connection. Username + password
 * login, bearer tokens (for the CLI), and the admin plugin (owner/user roles). `emailHash`
 * holds the registration email as a hash — never the plaintext.
 *
 * Password reset uses better-auth's own token, but the reset link is delivered to the
 * plaintext address stashed by the forgot-password handler (see reset-email-context) — the
 * stored `user.email` is synthetic, so better-auth itself never sees a real address.
 */
export const createAuth = (
  connectionString: string,
  secret: string,
  options: CreateAuthOptions = {},
) => {
  const client = postgres(connectionString)
  const db = drizzle(client, { schema })

  const auth = betterAuth({
    secret,
    ...(options.baseURL ? { baseURL: options.baseURL } : {}),
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ url }) => {
        const to = currentResetEmail()
        if (to) {
          await options.emailPort?.sendPasswordReset(to, url)
        }
      },
    },
    plugins: [username(), bearer(), admin()],
    user: {
      additionalFields: {
        emailHash: { type: 'string', required: false, input: true },
      },
    },
  })

  return { auth, db, close: () => client.end() }
}

export type Auth = ReturnType<typeof createAuth>['auth']
export type AuthDb = ReturnType<typeof createAuth>['db']

/** Adapter implementing the identity port over better-auth session/bearer validation. */
export const createIdentityPort = (auth: Auth): IdentityPort => ({
  validate: async (headers): Promise<AuthContext | null> => {
    const result = await auth.api.getSession({ headers })
    if (!result) {
      return null
    }
    return { userId: result.user.id, role: result.user.role ?? null }
  },
})
