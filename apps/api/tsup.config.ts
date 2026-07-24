import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts', 'src/instrumentation.ts'],
  format: ['esm'],
  target: 'node24',
  platform: 'node',
  outDir: 'dist',
  clean: true,
})
