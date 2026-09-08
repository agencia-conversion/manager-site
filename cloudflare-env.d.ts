/* Minimal Cloudflare env types. Regenerate full workerd types with:
   npm run generate:types:cloudflare
*/
declare namespace Cloudflare {
  interface Env {
    R2: R2Bucket
    D1: D1Database
    ASSETS: Fetcher
    PAYLOAD_SECRET: string
  }
}
interface CloudflareEnv extends Cloudflare.Env {}
