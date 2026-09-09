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

Binding KV: `BLOG` — **vincule no dashboard do Pages** (Settings → Functions → KV namespace bindings), com namespaces separados para preview e produção. O `wrangler.jsonc` não traz IDs de KV (placeholders quebram o deploy).

## Dev local

```bash
cp .dev.vars.example .dev.vars
# preencha ADMIN_PASSWORD e SESSION_SECRET
npm run dev
```

`npm run dev` sobe `wrangler pages dev` com `--kv=BLOG` (KV local simulada).

## Testes

```bash
export ADMIN_EMAIL=diego@conversion.com.br
export ADMIN_PASSWORD=…   # mesma do .dev.vars / Pages
export SESSION_SECRET=…
npx playwright test
```

Com `PREVIEW_URL` definido, o Playwright aponta para o preview (sem subir server local).
