import { OpenAPIHono } from '@hono/zod-openapi'
import { register } from './kit/http.ts'
import { requestContextMiddleware } from './lib/request-context.ts'
import { HealthController } from './modules/health/health.controller.ts'

const openApiInfo = {
  openapi: '3.1.0',
  info: { title: 'Taktikon API', version: '0.0.0' },
} as const

/**
 * Dependencies the app is wired with. Injected at the composition root (server.ts) so the
 * app can be built without a database in unit tests — pass nothing and auth is simply not
 * mounted.
 */
export type AppDeps = {
  authHandler?: (request: Request) => Response | Promise<Response>
  /** Registrars for decorated controllers, wired at the composition root. */
  controllers?: Array<(app: OpenAPIHono) => void>
}

export const createApp = (deps: AppDeps = {}) => {
  const app = new OpenAPIHono()

  app.use('*', requestContextMiddleware())

  register(app, HealthController, new HealthController())

  for (const mount of deps.controllers ?? []) {
    mount(app)
  }

  const authHandler = deps.authHandler
  if (authHandler) {
    app.on(['GET', 'POST'], '/api/auth/*', (c) => authHandler(c.req.raw))
  }

  app.doc('/doc', openApiInfo)

  return app
}

export const openApiDocument = () => createApp().getOpenAPIDocument(openApiInfo)
