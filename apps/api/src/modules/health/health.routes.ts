import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'

const HealthResponse = z.object({ status: z.literal('ok') }).openapi('HealthResponse')

const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['system'],
  summary: 'Liveness check',
  responses: {
    200: {
      content: { 'application/json': { schema: HealthResponse } },
      description: 'Service is up',
    },
  },
})

export const healthRoutes = new OpenAPIHono().openapi(healthRoute, (c) =>
  c.json({ status: 'ok' as const }, 200),
)
