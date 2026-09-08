import fs from 'fs'
import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { r2Storage } from '@payloadcms/storage-r2'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Landing } from './globals/Landing'
import { migrations } from './migrations'
import { seedFirstUserIfEmpty } from './seed/seedFirstUser'
import { seedLandingIfEmpty } from './seed/seedLanding'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => (fs.existsSync(value) ? fs.realpathSync(value) : undefined)

const isCLI = process.argv.some((value) => realpath(value)?.endsWith(path.join('payload', 'bin.js')))
const isProduction = process.env.NODE_ENV === 'production'
const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build'

const createLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'info',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: createLog('error', console.error),
  fatal: createLog('fatal', console.error),
  silent: () => {},
} as any

/** Noop D1/R2 so `next build` never opens local SQLite via getPlatformProxy (SQLITE_BUSY). */
function createBuildStubContext(): CloudflareContext {
  const emptyResult = {
    success: true,
    meta: {
      duration: 0,
      size_after: 0,
      rows_read: 0,
      rows_written: 0,
      last_row_id: 0,
      changed_db: false,
      changes: 0,
    },
    results: [] as unknown[],
  }

  const prepared: {
    bind: (...values: unknown[]) => typeof prepared
    first: <T = unknown>(colName?: string) => Promise<T | null>
    run: () => Promise<typeof emptyResult>
    all: <T = unknown>() => Promise<typeof emptyResult & { results: T[] }>
    raw: <T = unknown[]>() => Promise<T[]>
  } = {
    bind(..._values: unknown[]) {
      return prepared
    },
    first: async <T = unknown>(_colName?: string) => null as T | null,
    run: async () => emptyResult,
    all: async <T = unknown>() => ({ ...emptyResult, results: [] as T[] }),
    raw: async <T = unknown[]>() => [] as T[],
  }

  const d1 = {
    prepare(_query: string) {
      return prepared
    },
    batch: async (_statements: unknown[]) => [] as unknown[],
    exec: async (_query: string) => ({ count: 0, duration: 0 }),
    withSession(_constraintOrSession?: unknown) {
      return d1
    },
  }

  const r2 = {
    head: async (_key: string): Promise<null> => null,
    get: async (_key: string, _options?: unknown): Promise<null> => null,
    put: async (_key: string, _value: unknown, _options?: unknown) => ({
      key: _key,
      version: '',
      size: 0,
      etag: '',
      httpEtag: '',
      checksums: { toJSON: () => ({}) },
      uploaded: new Date(),
      httpMetadata: {},
      customMetadata: {},
    }),
    delete: async (_keys: string | string[]): Promise<void> => {},
    list: async (_options?: unknown) => ({
      objects: [] as unknown[],
      truncated: false,
      delimitedPrefixes: [] as string[],
    }),
  }

  return {
    env: {
      D1: d1,
      R2: r2,
      ASSETS: { fetch: async () => new Response(null, { status: 404 }) },
      PAYLOAD_SECRET: process.env.PAYLOAD_SECRET || 'build-stub',
    },
    cf: {} as never,
    ctx: {
      waitUntil() {},
      passThroughOnException() {},
      props: {},
    },
  } as unknown as CloudflareContext
}

const cloudflare = isNextBuild
  ? createBuildStubContext()
  : isCLI || !isProduction
    ? await getCloudflareContextFromWrangler()
    : await getCloudflareContext({ async: true })

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media],
  globals: [Landing],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({
    binding: cloudflare.env.D1,
    prodMigrations: migrations,
  }),
  logger: isProduction ? cloudflareLogger : undefined,
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
  ],
  onInit: async (payload) => {
    if (!isNextBuild) {
      await seedFirstUserIfEmpty(payload)
      await seedLandingIfEmpty(payload)
    }
  },
})

function getCloudflareContextFromWrangler(): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings: isProduction,
      }),
  )
}
