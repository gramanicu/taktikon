import { describe, expect, it } from 'vitest'
import { requestContext, runWithRequestContext } from './request-context.ts'

describe('requestContext', () => {
  it('returns the active context inside a scope', () => {
    runWithRequestContext({ requestId: 'req-123' }, () => {
      expect(requestContext().requestId).toBe('req-123')
    })
  })

  it('throws when read outside a request scope', () => {
    expect(() => requestContext()).toThrow(/outside of a request scope/)
  })
})
