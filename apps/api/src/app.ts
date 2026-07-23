import { OpenAPIHono } from '@hono/zod-openapi'
import { healthRoutes } from './modules/health/health.routes.ts'

const openApiInfo = {
  openapi: '3.1.0',
  info: { title: 'Taktikon API', version: '0.0.0' },
} as const

export const createApp = () => {
  const app = new OpenAPIHono()

  app.route('/', healthRoutes)
  app.doc('/doc', openApiInfo)

  return app
}

export const openApiDocument = () => createApp().getOpenAPIDocument(openApiInfo)
