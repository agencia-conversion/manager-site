# manager-site

Landing do Manager com **Payload 3 + D1 + OpenNext + R2**.

## Stack

- Next.js (OpenNext Cloudflare)
- Payload admin em `/admin` (Users)
- Global `landing` com drafts
- D1 (`D1`) + R2 (`R2`) — preview e prod separados

## Envs

| `CLOUDFLARE_ENV` | Worker | D1 / R2 |
| --- | --- | --- |
| `preview` | `manager-site-preview` | `manager-site-preview` |
| `production` | `manager-site` | `manager-site` |

Crie os D1/R2 na Cloudflare e troque os `database_id` placeholder em `wrangler.jsonc`. Defina o secret `PAYLOAD_SECRET` no Worker.

## Scripts

```bash
npm run dev
CLOUDFLARE_ENV=preview npm run deploy
CLOUDFLARE_ENV=production npm run deploy
```

`deploy` = migrate D1 + `deploy:app` (OpenNext).

## Testes

`npx playwright test` — usa `PREVIEW_URL` no pipeline; local sobe `next dev`.

## Seed

Copy da landing antiga em `src/seed/landing.ts`. No admin, publique o global Landing com esse conteúdo (ou use o fallback até existir doc publicada).
