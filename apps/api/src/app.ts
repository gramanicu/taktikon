import { OpenAPIHono } from '@hono/zod-openapi'
import { register } from './kit/http.ts'
import { requestContextMiddleware } from './lib/request-context.ts'
import { HealthController } from './modules/health/health.controller.ts'

const openApiInfo = {
  openapi: '3.1.0',
  info: { title: 'Taktikon API', version: '0.0.0' },
} as const

export const createApp = () => {
  const app = new OpenAPIHono()

  app.use('*', requestContextMiddleware())

  register(app, HealthController, new HealthController())
  app.doc('/doc', openApiInfo)

  return app
}

export const openApiDocument = () => createApp().getOpenAPIDocument(openApiInfo)
