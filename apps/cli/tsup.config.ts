import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node24',
  outDir: 'dist',
  clean: true,
  // Make the built entry directly executable as the `taktikon` bin.
  banner: { js: '#!/usr/bin/env node' },
})
