import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { sql } from 'drizzle-orm'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createDb, type Database } from './db.ts'

describe('createDb', () => {
  let container: StartedPostgreSqlContainer
  let db: Database
  let close: () => Promise<void>

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:17-alpine').start()
    ;({ db, close } = createDb(container.getConnectionUri()))
  })

  afterAll(async () => {
    await close?.()
    await container?.stop()
  })

  it('runs a query against a real Postgres', async () => {
    const rows = await db.execute<{ value: number }>(sql`select 1 as value`)
    expect(rows[0]?.value).toBe(1)
  })
})
