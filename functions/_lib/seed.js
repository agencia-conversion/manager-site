import { createPost, listPosts, updatePost } from "./posts.js";

const SEED_FLAG = "seed:v2";

const SEED_TITLE = "Bem-vindo ao blog do Manager";
const SEED_EXCERPT =
  "O site agora publica posts com admin restrito e conteúdo no KV.";
/** Body sem H1 — o título do post já é renderizado na página. */
const SEED_BODY = `Este é o post de exemplo do blog. Crie, edite e publique novos artigos em \`/admin\`.

## O que mudou

- A home lista posts publicados
- Cada artigo vive em \`/post/<slug>\`
- A landing antiga ficou em \`/manager\`
- O feed RSS está em \`/rss.xml\`
`;

/** @param {KVNamespace} kv */
export async function ensureSeed(kv) {
  if (await kv.get(SEED_FLAG)) return;

  const existing = await listPosts(kv);
  const welcome = existing.find((p) => p.title === SEED_TITLE);

  if (welcome) {
    // Repara seed:v1 que tinha um # no corpo (H1 duplicado na página do artigo).
    await updatePost(kv, welcome.id, { body: SEED_BODY, excerpt: SEED_EXCERPT });
    await kv.put(SEED_FLAG, "1");
    return;
  }

  if (existing.length > 0) {
    await kv.put(SEED_FLAG, "1");
    return;
  }

  await createPost(kv, {
    title: SEED_TITLE,
    excerpt: SEED_EXCERPT,
    body: SEED_BODY,
    published: true,
  });
  await kv.put(SEED_FLAG, "1");
}
