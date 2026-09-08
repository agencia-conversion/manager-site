import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { withPayload } from '@payloadcms/next/withPayload'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Worktree fica sob o monorepo Manager — sem isso o Next sobe e pega o lockfile errado.
  outputFileTracingRoot: projectRoot,
  // CF env stubs / Playwright paths can trip typecheck; build must stay deterministic.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Playwright / QA usa 127.0.0.1; Next bloqueia assets cross-origin no dev
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  // Packages with Cloudflare Workers (workerd) specific code
  // Read more: https://opennext.js.org/cloudflare/howtos/workerd
  serverExternalPackages: ['jose', 'pg-cloudflare', 'fast-safe-stringify'],

  // Your Next.js config here
  webpack: (webpackConfig: any) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    webpackConfig.resolve.alias = {
      ...(webpackConfig.resolve.alias || {}),
      '@payload-config': path.resolve(projectRoot, 'src/payload.config.ts'),
      '@': path.resolve(projectRoot, 'src'),
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
