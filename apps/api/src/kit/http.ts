/**
 * Decorator-based route authoring for Hono + OpenAPI.
 *
 * Two handler styles are supported — choose per handler:
 *
 * 1. **Return-based (preferred).** Omit `Context`; read input via the typed accessors
 *    (`params`/`query`/`body` from `./context.ts`) and `return` plain data. The framework
 *    serializes it at the first declared 2xx status. Cleanest and most testable; the
 *    handler never touches the Hono SDK.
 *
 *    ```ts
 *    @Get('/:id') @Params(IdParams) @Produces(Status.Ok, RosterSchema)
 *    get() { const { id } = params(IdParams); return this.rosters.byId(id) }
 *    ```
 *
 * 2. **Escape hatch.** Take `c: Context` and return a `Response` yourself (`c.json(...)`,
 *    streaming, redirects, custom headers). Use only when you need raw response control.
 *
 *    ```ts
 *    @Get('/raw') raw(c: Context) { return c.json({ ok: true }, 201) }
 *    ```
 *
 * DI is explicit: construct the controller and pass it to `register` — no container, no
 * reflect-metadata. Metadata rides on the standard Stage 3 `Symbol.metadata` slot.
 */
import { createRoute, type OpenAPIHono, type RouteConfig } from '@hono/zod-openapi'
import type { Context } from 'hono'
import type { ZodType } from 'zod'
import { runInHttpContext } from './context.ts'

// TC39 Stage 3 decorator metadata lives on Symbol.metadata, which V8 does not define yet.
// Establish it before any decorated class in the module graph is evaluated.
const symbolCtor = Symbol as unknown as { metadata?: symbol }
symbolCtor.metadata ??= Symbol('Symbol.metadata')
const METADATA = symbolCtor.metadata as symbol

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

/** A guard runs before the handler; returning a Response short-circuits the request. */
export type Guard = (c: Context) => Response | undefined | Promise<Response | undefined>

/**
 * A route handler. Return a `Response` (escape hatch) to control the response directly,
 * or return plain data to have it serialized at the first declared 2xx status. May take
 * `c: Context`, or omit it and use the `params`/`query`/`body` accessors.
 */
export type RouteHandler = (c: Context) => unknown

type RouteMeta = {
  method: HttpMethod
  path: string
  params?: ZodType
  query?: ZodType
  body?: ZodType
  responses: { status: number; schema: ZodType; description: string }[]
  guards: Guard[]
}

type ControllerMeta = {
  basePath: string
  guards: Guard[]
  routes: Map<string | symbol, RouteMeta>
}

const CONTROLLER = Symbol('taktikon.controller')

type MetaBag = { [CONTROLLER]?: ControllerMeta }

const controllerMeta = (metadata: DecoratorMetadata): ControllerMeta => {
  const bag = metadata as MetaBag
  bag[CONTROLLER] ??= { basePath: '', guards: [], routes: new Map() }
  return bag[CONTROLLER]
}

const routeMeta = (meta: ControllerMeta, name: string | symbol): RouteMeta => {
  let route = meta.routes.get(name)
  if (!route) {
    route = { method: 'get', path: '', responses: [], guards: [] }
    meta.routes.set(name, route)
  }
  return route
}

const method =
  (verb: HttpMethod, path: string) => (_value: unknown, context: ClassMethodDecoratorContext) => {
    const route = routeMeta(controllerMeta(context.metadata), context.name)
    route.method = verb
    route.path = path
  }

/** Maps a method to `GET <basePath><path>`. */
export const Get = (path: string) => method('get', path)
/** Maps a method to `POST <basePath><path>`. */
export const Post = (path: string) => method('post', path)
/** Maps a method to `PUT <basePath><path>`. */
export const Put = (path: string) => method('put', path)
/** Maps a method to `PATCH <basePath><path>`. */
export const Patch = (path: string) => method('patch', path)
/** Maps a method to `DELETE <basePath><path>`. */
export const Delete = (path: string) => method('delete', path)

/** Declares the path-param schema (validated by the route; read it via `params(schema)`). */
export const Params = (schema: ZodType) => (_v: unknown, context: ClassMethodDecoratorContext) => {
  routeMeta(controllerMeta(context.metadata), context.name).params = schema
}

/** Declares the query-string schema (validated by the route; read it via `query(schema)`). */
export const Query = (schema: ZodType) => (_v: unknown, context: ClassMethodDecoratorContext) => {
  routeMeta(controllerMeta(context.metadata), context.name).query = schema
}

/** Declares the JSON body schema (validated by the route; read it via `body(schema)`). */
export const Body = (schema: ZodType) => (_v: unknown, context: ClassMethodDecoratorContext) => {
  routeMeta(controllerMeta(context.metadata), context.name).body = schema
}

/** HTTP status codes as an `as const` map (no `enum`, per conventions). */
export const Status = {
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NoContent: 204,
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
  UnprocessableEntity: 422,
  TooManyRequests: 429,
  Internal: 500,
  ServiceUnavailable: 503,
} as const

const reasonPhrase: Record<number, string> = {
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  204: 'No Content',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
}

/**
 * Declares a response: status + schema for the OpenAPI spec. The first declared 2xx status
 * is used to serialize a return-based handler's value. `description` defaults to the status
 * reason-phrase, so it is only needed for richer prose. Stack it for multiple statuses.
 */
export const Produces =
  (status: number, schema: ZodType, description?: string) =>
  (_v: unknown, context: ClassMethodDecoratorContext) => {
    routeMeta(controllerMeta(context.metadata), context.name).responses.push({
      status,
      schema,
      description: description ?? reasonPhrase[status] ?? 'Response',
    })
  }

/** Prefixes every route in the class with `basePath` (e.g. `@Controller('/rosters')`). */
export const Controller =
  (basePath = '') =>
  (_value: unknown, context: ClassDecoratorContext) => {
    controllerMeta(context.metadata).basePath = basePath
  }

/**
 * Stacks guards to run before the handler. On the class, applies to every route; on a
 * method, only that route. A guard returning a Response short-circuits.
 */
export const UseGuard =
  (...guards: Guard[]) =>
  (_value: unknown, context: ClassDecoratorContext | ClassMethodDecoratorContext) => {
    const meta = controllerMeta(context.metadata)
    if (context.kind === 'class') {
      meta.guards.push(...guards)
    } else {
      routeMeta(meta, context.name).guards.push(...guards)
    }
  }

type ControllerClass = abstract new (...args: never[]) => object

/**
 * Reads the decorator metadata off a controller class and mounts every route onto the app.
 * DI is explicit — construct the instance and pass it in:
 * `register(app, RosterController, new RosterController(deps))`.
 */
export const register = (app: OpenAPIHono, controller: ControllerClass, instance: object) => {
  const meta = (controller as unknown as Record<symbol, MetaBag | undefined>)[METADATA]?.[
    CONTROLLER
  ]
  if (!meta) return

  for (const [name, route] of meta.routes) {
    // Loosely typed here: the shapes are validated by @hono/zod-openapi at createRoute time.
    const request: Record<string, unknown> = {}
    if (route.params) request.params = route.params
    if (route.query) request.query = route.query
    if (route.body) request.body = { content: { 'application/json': { schema: route.body } } }

    const responses: Record<number, unknown> = {}
    for (const res of route.responses) {
      responses[res.status] = {
        description: res.description,
        content: { 'application/json': { schema: res.schema } },
      }
    }
    if (route.responses.length === 0) {
      responses[200] = { description: 'OK' }
    }

    const config = createRoute({
      method: route.method,
      path: `${meta.basePath}${route.path}`,
      request,
      responses,
    } as unknown as RouteConfig)

    const guards = [...meta.guards, ...route.guards]
    const handlerFn = (instance as Record<string | symbol, RouteHandler | undefined>)[name]
    if (!handlerFn) continue
    const handler = handlerFn.bind(instance)
    const successStatus =
      route.responses.find((res) => res.status >= 200 && res.status < 300)?.status ?? 200

    app.openapi(
      config as never,
      (async (c: Context) =>
        runInHttpContext(c, async () => {
          for (const guard of guards) {
            const shortCircuit = await guard(c)
            if (shortCircuit) return shortCircuit
          }
          const result = await handler(c)
          // Escape hatch: a handler may build its own Response; otherwise serialize the
          // returned value at the first declared 2xx status.
          return result instanceof Response
            ? result
            : c.json(result as never, successStatus as never)
        })) as never,
    )
  }
}
