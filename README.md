# manager-site

Blog do Manager no Cloudflare Pages (Functions + KV).

## Rotas

- `/` — lista de posts publicados
- `/post/<slug>` — artigo
- `/manager` — landing original
- `/rss.xml` — feed RSS
- `/admin` — CRUD (login obrigatório)

## Env (Pages / local)

Configure no painel do Cloudflare (preview e prod) e em `.dev.vars` local:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

Binding KV: `BLOG` (namespace separado por ambiente). Os IDs em `wrangler.jsonc` são placeholders — troque pelos namespaces reais ou vincule no dashboard.

## Dev local

```bash
cp .dev.vars.example .dev.vars
# preencha ADMIN_PASSWORD e SESSION_SECRET
npx wrangler pages dev
```

## Testes

```bash
export ADMIN_EMAIL=diego@conversion.com.br
export ADMIN_PASSWORD=…   # mesma do .dev.vars / Pages
export SESSION_SECRET=…
npx playwright test
```

Com `PREVIEW_URL` definido, o Playwright aponta para o preview (sem subir server local).
