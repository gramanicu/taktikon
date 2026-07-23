import { AsyncLocalStorage } from 'node:async_hooks'
import type { Context } from 'hono'
import type { z } from 'zod'

const storage = new AsyncLocalStorage<Context>()

/** Runs `fn` with the request's Context bound so the accessors below can reach it. */
export const runInHttpContext = <T>(c: Context, fn: () => T): T => storage.run(c, fn)

/**
 * The raw Hono Context for the in-flight request. Throws if called outside a handler
 * (a programmer error). Prefer the typed accessors below; reach for this only when you
 * need something they don't expose (headers, cookies, streaming).
 */
export const ctx = (): Context => {
  const c = storage.getStore()
  if (!c) {
    throw new Error('ctx() called outside of a request handler')
  }
  return c
}

/** Typed, validated path params for the current request. Pair with `@Params(schema)`. */
export const params = <T extends z.ZodType>(schema: T): z.infer<T> =>
  schema.parse(ctx().req.param()) as z.infer<T>

/** Typed, validated query string for the current request. Pair with `@Query(schema)`. */
export const query = <T extends z.ZodType>(schema: T): z.infer<T> =>
  schema.parse(ctx().req.query()) as z.infer<T>

/** Typed, validated JSON body for the current request. Pair with `@Body(schema)`. */
export const body = async <T extends z.ZodType>(schema: T): Promise<z.infer<T>> =>
  schema.parse(await ctx().req.json()) as z.infer<T>
