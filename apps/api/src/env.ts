import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  // Optional until a module wires the DB/cache; tighten to required at that point.
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
})

export const env = EnvSchema.parse(process.env)
