import { createPost, ensureIndexed, getPost, listPosts, updatePost } from "./posts.js";

const SEED_FLAG = "seed:v3";
const SEED_ID = "seed-welcome";

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

/** Marcador exclusivo do body v1 (H1 duplicado). Só reparamos se ainda estiver presente. */
const LEGACY_V1_H1 = "# Bem-vindo ao blog do Manager";

/** @param {KVNamespace} kv */
export async function ensureSeed(kv) {
  if (await kv.get(SEED_FLAG)) return;

  const existing = await listPosts(kv);

  // Repara apenas posts que ainda têm o H1 legado no corpo — nunca sobrescreve edição do admin.
  for (const p of existing) {
    if (typeof p.body === "string" && p.body.includes(LEGACY_V1_H1)) {
      await updatePost(kv, p.id, { body: SEED_BODY, excerpt: SEED_EXCERPT });
    }
  }

  const afterRepair = existing.length > 0 ? existing : await listPosts(kv);
  if (afterRepair.length === 0) {
    const already = await getPost(kv, SEED_ID);
    if (already) {
      // Órfão: post existe mas sumiu do índice — só reindexa.
      await ensureIndexed(kv, SEED_ID);
    } else {
      await createPost(
        kv,
        {
          title: SEED_TITLE,
          excerpt: SEED_EXCERPT,
          body: SEED_BODY,
          published: true,
        },
        { id: SEED_ID },
      );
    }
  }

  await kv.put(SEED_FLAG, "1");
}
