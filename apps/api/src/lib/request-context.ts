import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import type { MiddlewareHandler } from 'hono'

export type RequestContext = {
  requestId: string
}

const storage = new AsyncLocalStorage<RequestContext>()

export const runWithRequestContext = <T>(context: RequestContext, fn: () => T): T =>
  storage.run(context, fn)

/**
 * Read the request-scoped context. Throws if called outside a request scope — using
 * request state where no request is in flight is a programmer error, not a recoverable
 * condition, so this asserts rather than returning a Result.
 */
export const requestContext = (): RequestContext => {
  const context = storage.getStore()
  if (!context) {
    throw new Error('requestContext() called outside of a request scope')
  }
  return context
}

/** Establishes a per-request context (currently a request id) for the whole call chain. */
export const requestContextMiddleware = (): MiddlewareHandler => async (c, next) => {
  const requestId = c.req.header('x-request-id') ?? randomUUID()
  c.header('x-request-id', requestId)
  await runWithRequestContext({ requestId }, next)
}
