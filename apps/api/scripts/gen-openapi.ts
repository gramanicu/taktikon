import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { openApiDocument } from '../src/app.ts'

const outPath = fileURLToPath(new URL('../openapi.json', import.meta.url))

writeFileSync(outPath, `${JSON.stringify(openApiDocument(), null, 2)}\n`)
console.log(`wrote ${outPath}`)
