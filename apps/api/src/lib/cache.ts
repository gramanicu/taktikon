import { Redis } from 'ioredis'

/**
 * Creates a Redis client. The URL is passed explicitly (from `env.REDIS_URL` at bootstrap,
 * or a container URL in tests) to keep this free of the env boundary. Call `.quit()` on
 * shutdown.
 */
export const createCache = (url: string): Redis => new Redis(url)
