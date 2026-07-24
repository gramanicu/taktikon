import { serve } from '@hono/node-server'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { createApp } from './app.ts'
import { env } from './env.ts'
import { register } from './kit/http.ts'
import { initFlags } from './lib/flags.ts'
import { logger } from './lib/logger.ts'
import { createUnleashProvider } from './lib/unleash-provider.ts'
import { createAuth } from './modules/identity/auth.ts'
import { consoleEmailAdapter } from './modules/identity/email.console-adapter.ts'
import { makeEmailHasher } from './modules/identity/email-hash.ts'
import { IdentityController } from './modules/identity/identity.controller.ts'
import { makeFindUserByUsername } from './modules/identity/user-lookup.ts'

// Composition root: build dependencies from the validated env, then assemble the app.
if (!env.DATABASE_URL || !env.AUTH_SECRET) {
  throw new Error('DATABASE_URL and AUTH_SECRET are required to start the server')
}

await initFlags(
  env.UNLEASH_URL && env.UNLEASH_TOKEN
    ? createUnleashProvider({
        url: env.UNLEASH_URL,
        appName: 'taktikon-api',
        token: env.UNLEASH_TOKEN,
      })
    : undefined,
)

const emailPort = consoleEmailAdapter()
const { auth, db } = createAuth(env.DATABASE_URL, env.AUTH_SECRET, {
  baseURL: env.AUTH_URL ?? `http://localhost:${env.PORT}`,
  emailPort,
})

const controllers: Array<(app: OpenAPIHono) => void> = []
if (env.EMAIL_HASH_PEPPER) {
  const identity = new IdentityController({
    auth,
    hashEmail: makeEmailHasher(env.EMAIL_HASH_PEPPER),
    findUserByUsername: makeFindUserByUsername(db),
  })
  controllers.push((app) => register(app, IdentityController, identity))
}

const app = createApp({ authHandler: auth.handler, controllers })

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info('api.listening', { url: `http://localhost:${info.port}` })
})
