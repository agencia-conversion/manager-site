import fs from 'node:fs'
import path from 'node:path'

/** OpenNext shim de @next/env não tem default export; Payload CLI quebra no mesmo import. */
const STUB_JS = `export function loadEnv() {}\n`
const STUB_TS = `export function loadEnv(_path?: string) {}\n`

const files = [
  ['node_modules/payload/dist/bin/loadEnv.js', STUB_JS],
  ['node_modules/payload/src/bin/loadEnv.ts', STUB_TS],
]

for (const [rel, body] of files) {
  const file = path.join(process.cwd(), rel)
  if (!fs.existsSync(file)) continue
  fs.writeFileSync(file, body)
}
