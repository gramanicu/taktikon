import { defineConfig } from 'drizzle-kit'

// Tooling config: reads DATABASE_URL directly (a documented exception to the env boundary,
// since drizzle-kit runs outside the app). Schema lives per-module as `*.table.ts`.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/**/*.table.ts',
  out: './db/migrations',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
})
