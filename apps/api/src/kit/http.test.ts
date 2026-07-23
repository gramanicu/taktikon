import { OpenAPIHono, z } from '@hono/zod-openapi'
import type { Context } from 'hono'
import { describe, expect, it } from 'vitest'
import { params } from './context.ts'
import { Controller, Get, Params, Produces, register, Status } from './http.ts'

const EchoParams = z.object({ id: z.string() })

@Controller('/demo')
class DemoController {
  // Return-based: framework serializes the value at the first 2xx status.
  @Get('/return')
  @Produces(Status.Ok, z.object({ ok: z.boolean() }))
  ret() {
    return { ok: true }
  }

  // Escape hatch: build the Response directly.
  @Get('/raw')
  @Produces(Status.Created, z.object({ raw: z.boolean() }))
  raw(c: Context) {
    return c.json({ raw: true }, 201)
  }

  // Return-based + typed ALS accessor for input.
  @Get('/echo/:id')
  @Params(EchoParams)
  @Produces(Status.Ok, EchoParams)
  echo() {
    const { id } = params(EchoParams)
    return { id }
  }
}

describe('http kit', () => {
  const app = new OpenAPIHono()
  register(app, DemoController, new DemoController())

  it('serializes a returned value at the first 2xx status', async () => {
    const res = await app.request('/demo/return')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('passes through a handler-built Response (escape hatch)', async () => {
    const res = await app.request('/demo/raw')
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ raw: true })
  })

  it('reads typed params via the ALS accessor', async () => {
    const res = await app.request('/demo/echo/abc')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id: 'abc' })
  })
})
