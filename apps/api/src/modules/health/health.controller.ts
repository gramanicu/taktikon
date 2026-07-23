import { z } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { Controller, Get, Produces, Status } from '../../kit/http.ts'

const HealthResponse = z.object({ status: z.literal('ok') }).openapi('HealthResponse')

@Controller()
export class HealthController {
  @Get('/health')
  @Produces(Status.Ok, HealthResponse)
  health(c: Context) {
    return c.json({ status: 'ok' as const }, 200)
  }
}
