// Generation-only config: used by `@better-auth/cli generate` to emit the Drizzle schema
// (auth.table.ts). The placeholder connection is never opened (postgres.js is lazy).
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, bearer, username } from 'better-auth/plugins'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const db = drizzle(postgres('postgres://localhost:5432/placeholder'))

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  plugins: [username(), bearer(), admin()],
  user: {
    additionalFields: {
      emailHash: { type: 'string', required: false, input: true },
    },
  },
})
