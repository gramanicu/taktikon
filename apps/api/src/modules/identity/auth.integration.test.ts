import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Auth, createAuth, createIdentityPort } from './auth.ts'

const SECRET = 'test-secret-value-at-least-32-characters-long'
const CREDENTIALS = {
  email: 'player1@example.com',
  password: 'correct-horse-battery',
  name: 'Player One',
  username: 'player1',
}

describe('auth', () => {
  let container: StartedPostgreSqlContainer
  let auth: Auth
  let close: () => Promise<void>

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:17-alpine').start()
    const uri = container.getConnectionUri()

    const migrationClient = postgres(uri, { max: 1 })
    await migrate(drizzle(migrationClient), { migrationsFolder: './db/migrations' })
    await migrationClient.end()
    ;({ auth, close } = createAuth(uri, SECRET, { baseURL: 'http://localhost:3000' }))
  })

  afterAll(async () => {
    await close?.()
    await container?.stop()
  })

  it('signs up, logs in by username, and validates via the identity port', async () => {
    const identity = createIdentityPort(auth)

    const signUp = await auth.api.signUpEmail({ body: CREDENTIALS })
    expect(signUp.user.username).toBe('player1')

    const signedUpCtx = await identity.validate(
      new Headers({ authorization: `Bearer ${signUp.token}` }),
    )
    expect(signedUpCtx?.userId).toBe(signUp.user.id)

    const signIn = await auth.api.signInUsername({
      body: { username: CREDENTIALS.username, password: CREDENTIALS.password },
    })
    expect(signIn?.token).toBeTruthy()

    const signedInCtx = await identity.validate(
      new Headers({ authorization: `Bearer ${signIn?.token}` }),
    )
    expect(signedInCtx?.userId).toBe(signUp.user.id)
  })

  it('rejects an unauthenticated request', async () => {
    const identity = createIdentityPort(auth)
    expect(await identity.validate(new Headers())).toBeNull()
  })
})
