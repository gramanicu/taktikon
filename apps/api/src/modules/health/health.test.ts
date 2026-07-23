import { describe, expect, it } from 'vitest'
import { createApp } from '../../app.ts'

describe('GET /health', () => {
  it('returns ok', async () => {
    const app = createApp()

    const res = await app.request('/health')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })

  it('sets an x-request-id response header', async () => {
    const app = createApp()

    const res = await app.request('/health')

    expect(res.headers.get('x-request-id')).toBeTruthy()
  })

  it('echoes a provided x-request-id', async () => {
    const app = createApp()

    const res = await app.request('/health', { headers: { 'x-request-id': 'fixed-id' } })

    expect(res.headers.get('x-request-id')).toBe('fixed-id')
  })
})
