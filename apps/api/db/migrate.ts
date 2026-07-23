import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

// Standalone migration runner (run via `pnpm --filter @taktikon/api db:migrate`, which
// supplies DATABASE_URL through Node's --env-file). Reads process.env directly as a script.
const url = process.env.DATABASE_URL
if (!url) {
  throw new Error('DATABASE_URL is required to run migrations')
}

const client = postgres(url, { max: 1 })
await migrate(drizzle(client), { migrationsFolder: './db/migrations' })
await client.end()
console.log('migrations applied')
