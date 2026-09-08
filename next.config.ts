import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  // Playwright / QA usa 127.0.0.1; Next 16 bloqueia assets cross-origin no dev
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
  // NÃO listar db-d1-sqlite/drizzle-kit aqui: no Turbopack o Next gera
  // require("pkg-<hash>/api") e o OpenNext não resolve (payload#16470).
  // O build usa `next build --webpack` pra aplicar webpack.externals +
  // IgnorePlugin do withPayload e tirar drizzle-kit do bundle.
  serverExternalPackages: ['jose', 'pg-cloudflare'],

  // Your Next.js config here
  webpack: (webpackConfig: any) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
