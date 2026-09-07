# manager-site

Blog estático do Manager. Preview/prod no Cloudflare Pages (`public/`).

Sem CMS: post = arquivo no repo. Publicar = abrir PR.

## Adicionar um post

1. Crie `public/blog/<slug>/index.html` (copie um post existente).
2. Preencha `<title>`, meta description, OG, canonical, `<h1>`, `<time datetime>`, autor e corpo em `.prose`.
3. Inclua o post no topo da lista em `public/index.html` (mais recente primeiro): título, data, resumo, tempo de leitura e link.
4. Atualize `public/rss.xml` (novo `<item>` no topo) e `public/sitemap.xml` (nova `<url>`).
5. Abra o PR. QA/Playwright e preview vêm no fluxo do Manager.

Slugs: minúsculas, hífens, sem acento. HTML direto — não há passo de Markdown.

## Testes

```bash
npx playwright test
```

No pipeline, use `PREVIEW_URL` (ou `BASE_URL`) apontando para o preview.
