import { createPost, listPosts } from "./posts.js";

const SEED_FLAG = "seed:v1";

/** @param {KVNamespace} kv */
export async function ensureSeed(kv) {
  if (await kv.get(SEED_FLAG)) return;
  const existing = await listPosts(kv);
  if (existing.length > 0) {
    await kv.put(SEED_FLAG, "1");
    return;
  }
  await createPost(kv, {
    title: "Bem-vindo ao blog do Manager",
    excerpt: "O site agora publica posts com admin restrito e conteúdo no KV.",
    body: `# Bem-vindo

Este é o post de exemplo do blog. Crie, edite e publique novos artigos em \`/admin\`.

## O que mudou

- A home lista posts publicados
- Cada artigo vive em \`/post/<slug>\`
- A landing antiga ficou em \`/manager\`
- O feed RSS está em \`/rss.xml\`
`,
    published: true,
  });
  await kv.put(SEED_FLAG, "1");
}
