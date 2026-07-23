import { defineConfig } from 'tsup'

// Bundles the generated client (resolving its extensionless imports) into a single ESM
// module + type declarations, so consumers import built output rather than raw generated
// source.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  target: 'node24',
  outDir: 'dist',
  clean: true,
})
