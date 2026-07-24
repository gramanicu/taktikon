import { serve } from '@hono/node-server'
import { createApp } from './app.ts'
import { env } from './env.ts'
import { createAuth } from './modules/identity/auth.ts'

// Composition root: build dependencies from the validated env, then assemble the app.
if (!env.DATABASE_URL || !env.AUTH_SECRET) {
  throw new Error('DATABASE_URL and AUTH_SECRET are required to start the server')
}

const { auth } = createAuth(
  env.DATABASE_URL,
  env.AUTH_SECRET,
  env.AUTH_URL ?? `http://localhost:${env.PORT}`,
)
const app = createApp({ authHandler: auth.handler })

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Taktikon API listening on http://localhost:${info.port}`)
})
