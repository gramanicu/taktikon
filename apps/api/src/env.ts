import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  // Optional until a module wires the DB/cache; tighten to required at that point.
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  // Signing secret for auth sessions/tokens. Required to boot the auth module.
  AUTH_SECRET: z.string().min(1).optional(),
  // Public base URL of the API, used by auth for callback/reset links.
  AUTH_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  // Feature flags: when both are set, the Unleash provider is used; otherwise flags
  // resolve to their in-code defaults.
  UNLEASH_URL: z.string().url().optional(),
  UNLEASH_TOKEN: z.string().optional(),
  // Pepper for hashing registration emails. Required to enable register/forgot-password.
  EMAIL_HASH_PEPPER: z.string().min(1).optional(),
})

export const env = EnvSchema.parse(process.env)
