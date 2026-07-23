import { defineConfig } from '@hey-api/openapi-ts'

// Reads the API's emitted spec (produced by `@taktikon/api gen:openapi`) and generates a
// typed fetch client into src/generated (gitignored — regenerated via `pnpm gen`).
export default defineConfig({
  input: '../../apps/api/openapi.json',
  output: 'src/generated',
  plugins: ['@hey-api/client-fetch'],
})
