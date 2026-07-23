import type { Redis } from 'ioredis'
import { GenericContainer, type StartedTestContainer } from 'testcontainers'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createCache } from './cache.ts'

describe('createCache', () => {
  let container: StartedTestContainer
  let cache: Redis

  beforeAll(async () => {
    container = await new GenericContainer('redis:7-alpine').withExposedPorts(6379).start()
    cache = createCache(`redis://${container.getHost()}:${container.getMappedPort(6379)}`)
  })

  afterAll(async () => {
    await cache?.quit()
    await container?.stop()
  })

  it('round-trips a value through a real Redis', async () => {
    await cache.set('probe', 'ok')
    expect(await cache.get('probe')).toBe('ok')
  })
})
