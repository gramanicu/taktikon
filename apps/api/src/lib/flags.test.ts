import { InMemoryProvider } from '@openfeature/server-sdk'
import { beforeAll, describe, expect, it } from 'vitest'
import { initFlags, isEnabled } from './flags.ts'

describe('flags', () => {
  beforeAll(async () => {
    await initFlags(
      new InMemoryProvider({
        'new-army-builder': {
          disabled: false,
          variants: { on: true, off: false },
          defaultVariant: 'on',
        },
      }),
    )
  })

  it('reads an enabled flag from the provider', async () => {
    expect(await isEnabled('new-army-builder')).toBe(true)
  })

  it('falls back to the default for an unknown flag', async () => {
    expect(await isEnabled('does-not-exist', false)).toBe(false)
  })
})
