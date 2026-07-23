import { serve } from '@hono/node-server'
import { createApp } from './app.ts'
import { env } from './env.ts'

const app = createApp()

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`Taktikon API listening on http://localhost:${info.port}`)
})
