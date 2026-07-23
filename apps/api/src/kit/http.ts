import { createRoute, type OpenAPIHono, type RouteConfig } from '@hono/zod-openapi'
import type { Context } from 'hono'
import type { ZodType } from 'zod'

// TC39 Stage 3 decorator metadata lives on Symbol.metadata, which V8 does not define yet.
// Establish it before any decorated class in the module graph is evaluated.
const symbolCtor = Symbol as unknown as { metadata?: symbol }
symbolCtor.metadata ??= Symbol('Symbol.metadata')
const METADATA = symbolCtor.metadata as symbol

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

/** A guard runs before the handler; returning a Response short-circuits the request. */
export type Guard = (c: Context) => Response | undefined | Promise<Response | undefined>

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

export const Get = (path: string) => method('get', path)
export const Post = (path: string) => method('post', path)
export const Put = (path: string) => method('put', path)
export const Patch = (path: string) => method('patch', path)
export const Delete = (path: string) => method('delete', path)

export const Params = (schema: ZodType) => (_v: unknown, context: ClassMethodDecoratorContext) => {
  routeMeta(controllerMeta(context.metadata), context.name).params = schema
}

export const Query = (schema: ZodType) => (_v: unknown, context: ClassMethodDecoratorContext) => {
  routeMeta(controllerMeta(context.metadata), context.name).query = schema
}

export const Body = (schema: ZodType) => (_v: unknown, context: ClassMethodDecoratorContext) => {
  routeMeta(controllerMeta(context.metadata), context.name).body = schema
}

export const Produces =
  (status: number, schema: ZodType, description = 'Response') =>
  (_v: unknown, context: ClassMethodDecoratorContext) => {
    routeMeta(controllerMeta(context.metadata), context.name).responses.push({
      status,
      schema,
      description,
    })
  }

export const Controller =
  (basePath = '') =>
  (_value: unknown, context: ClassDecoratorContext) => {
    controllerMeta(context.metadata).basePath = basePath
  }

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

/** Read the decorator metadata off a controller class and mount every route onto the app. */
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
    const handlerFn = (instance as Record<string | symbol, Guard | undefined>)[name]
    if (!handlerFn) continue
    const handler = handlerFn.bind(instance)

    app.openapi(
      config as never,
      (async (c: Context) => {
        for (const guard of guards) {
          const shortCircuit = await guard(c)
          if (shortCircuit) return shortCircuit
        }
        return handler(c)
      }) as never,
    )
  }
}
