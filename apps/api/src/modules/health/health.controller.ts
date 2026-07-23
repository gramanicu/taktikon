import { z } from '@hono/zod-openapi'
import { Controller, Get, Produces, Status } from '../../kit/http.ts'

const HealthResponse = z.object({ status: z.literal('ok') }).openapi('HealthResponse')

@Controller()
export class HealthController {
  // Return-based style: no Context, just return the payload.
  @Get('/health')
  @Produces(Status.Ok, HealthResponse)
  health() {
    return { status: 'ok' as const }
  }
}
