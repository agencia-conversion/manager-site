import { escapeHtml, htmlResponse, page } from "../_lib/html.js";
import { renderMarkdown } from "../_lib/markdown.js";
import { formatDate, getPostBySlug } from "../_lib/posts.js";
import { ensureSeed } from "../_lib/seed.js";

/**
 * @param {{ request: Request, env: { BLOG: KVNamespace }, params: { slug: string } }} context
 */
export async function onRequestGet(context) {
  const { env, params } = context;
  await ensureSeed(env.BLOG);
  const post = await getPostBySlug(env.BLOG, params.slug);

  if (!post || !post.published) {
    return htmlResponse(
      page({
        title: "Não encontrado — Manager",
        body: `<section class="hero"><h1>Post não encontrado</h1><p class="lede"><a href="/">Voltar ao blog</a></p></section>`,
      }),
      404,
    );
  }

  const body = `
    <article class="post">
      <p class="kicker">${escapeHtml(formatDate(post.createdAt))}</p>
      <h1>${escapeHtml(post.title)}</h1>
      <div class="prose">${renderMarkdown(post.body)}</div>
      <p class="back"><a href="/">← Todos os posts</a></p>
    </article>`;

  return htmlResponse(page({ title: `${post.title} — Manager`, body }), 200, {
    cacheControl: "public, max-age=60",
  });
}
