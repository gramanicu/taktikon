import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, bearer, username } from 'better-auth/plugins'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './auth.table.ts'
import type { AuthContext, IdentityPort } from './identity.port.ts'

/**
 * Builds the better-auth instance over its own Postgres connection. Username + password
 * login, bearer tokens (for the CLI), and the admin plugin (owner/user roles + a
 * setUserPassword primitive the custom reset flow will use). `emailHash` holds the
 * registration email as a hash — never the plaintext.
 */
export const createAuth = (connectionString: string, secret: string, baseURL?: string) => {
  const client = postgres(connectionString)
  const db = drizzle(client, { schema })

  const auth = betterAuth({
    secret,
    baseURL,
    database: drizzleAdapter(db, { provider: 'pg', schema }),
    emailAndPassword: { enabled: true },
    plugins: [username(), bearer(), admin()],
    user: {
      additionalFields: {
        emailHash: { type: 'string', required: false, input: true },
      },
    },
  })

  return { auth, close: () => client.end() }
}

export type Auth = ReturnType<typeof createAuth>['auth']

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
