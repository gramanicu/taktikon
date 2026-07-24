import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../../app.ts'
import { register } from '../../kit/http.ts'
import { type Auth, createAuth } from './auth.ts'
import type { EmailPort } from './email.port.ts'
import { makeEmailHasher } from './email-hash.ts'
import { IdentityController } from './identity.controller.ts'
import { makeFindUserByUsername } from './user-lookup.ts'

const SECRET = 'test-secret-value-at-least-32-characters-long'
const PEPPER = 'test-pepper'
const USER = { username: 'commander', email: 'real.person@example.com', password: 'old-password-1' }

const json = (payload: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
})

describe('password reset flow', () => {
  let container: StartedPostgreSqlContainer
  let auth: Auth
  let close: () => Promise<void>
  let app: ReturnType<typeof createApp>
  const sent: { to: string; resetUrl: string }[] = []

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:17-alpine').start()
    const uri = container.getConnectionUri()

    const migrationClient = postgres(uri, { max: 1 })
    await migrate(drizzle(migrationClient), { migrationsFolder: './db/migrations' })
    await migrationClient.end()

    const emailPort: EmailPort = {
      sendPasswordReset: async (to, resetUrl) => {
        sent.push({ to, resetUrl })
      },
    }

    let db: ReturnType<typeof createAuth>['db']
    ;({ auth, db, close } = createAuth(uri, SECRET, {
      baseURL: 'http://localhost:3000',
      emailPort,
    }))

    const identity = new IdentityController({
      auth,
      hashEmail: makeEmailHasher(PEPPER),
      findUserByUsername: makeFindUserByUsername(db),
    })
    app = createApp({
      authHandler: auth.handler,
      controllers: [(a) => register(a, IdentityController, identity)],
    })
  })

  afterAll(async () => {
    await close?.()
    await container?.stop()
  })

  it('registers, resets via the emailed token, and logs in with the new password', async () => {
    const registered = await app.request('/api/identity/register', json(USER))
    expect(registered.status).toBe(201)

    // Wrong email: no reset mail is sent.
    await app.request(
      '/api/identity/forgot-password',
      json({ username: USER.username, email: 'wrong@example.com' }),
    )
    expect(sent).toHaveLength(0)

    // Correct email: a reset link is delivered to the plaintext address.
    const forgot = await app.request(
      '/api/identity/forgot-password',
      json({ username: USER.username, email: USER.email }),
    )
    expect(forgot.status).toBe(202)
    expect(sent).toHaveLength(1)
    expect(sent[0]?.to).toBe(USER.email)

    const resetUrl = sent[0]?.resetUrl ?? ''
    const parsed = new URL(resetUrl)
    const token =
      parsed.searchParams.get('token') ??
      decodeURIComponent(parsed.pathname.split('/').filter(Boolean).pop() ?? '')
    expect(token).toBeTruthy()

    const newPassword = 'brand-new-password-2'
    await auth.api.resetPassword({ body: { newPassword, token: token ?? '' } })

    const signIn = await auth.api.signInUsername({
      body: { username: USER.username, password: newPassword },
    })
    expect(signIn?.token).toBeTruthy()
  })
})
