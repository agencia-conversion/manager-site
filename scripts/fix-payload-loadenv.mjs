import fs from 'node:fs'
import path from 'node:path'

const file = path.join(process.cwd(), 'node_modules/payload/dist/bin/loadEnv.js')
if (!fs.existsSync(file)) process.exit(0)

const src = fs.readFileSync(file, 'utf8')
const next = src.replace(
  "import nextEnvImport from '@next/env';",
  "import * as nextEnvImport from '@next/env';",
)
if (next !== src) fs.writeFileSync(file, next)
