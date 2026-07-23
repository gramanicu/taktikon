import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

export type Database = ReturnType<typeof drizzle>

/**
 * Creates a Drizzle client over a postgres.js connection. The connection string is passed
 * explicitly (from `env.DATABASE_URL` at bootstrap, or a container URL in tests) so this
 * stays free of the env boundary and easy to test. Call `close()` on shutdown.
 */
export const createDb = (
  connectionString: string,
): { db: Database; close: () => Promise<void> } => {
  const client = postgres(connectionString)
  return { db: drizzle(client), close: () => client.end() }
}
