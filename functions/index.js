import { escapeHtml, htmlResponse, page } from "./_lib/html.js";
import { formatDate, listPublished } from "./_lib/posts.js";
import { ensureSeed } from "./_lib/seed.js";

/**
 * @param {{ request: Request, env: { BLOG: KVNamespace } }} context
 */
export async function onRequestGet(context) {
  const { env } = context;
  await ensureSeed(env.BLOG);
  const posts = await listPublished(env.BLOG);

  const items =
    posts.length === 0
      ? `<p class="lede">Nenhum post publicado ainda.</p>`
      : `<ul class="post-list">
      ${posts
        .map(
          (p) => `<li>
          <a href="/post/${encodeURIComponent(p.slug)}">
            <h2>${escapeHtml(p.title)}</h2>
          </a>
          <time datetime="${escapeHtml(p.createdAt)}">${escapeHtml(formatDate(p.createdAt))}</time>
          <p>${escapeHtml(p.excerpt)}</p>
        </li>`,
        )
        .join("")}
    </ul>`;

  const body = `
    <section class="hero" aria-labelledby="blog-title">
      <p class="kicker">Conversion · blog</p>
      <h1 id="blog-title">Blog do Manager</h1>
      <p class="lede">Notas sobre o control plane, previews e o fluxo de issues.</p>
    </section>
    <section class="posts" aria-label="Posts publicados">
      ${items}
    </section>`;

  return htmlResponse(page({ title: "Blog — Manager", body }), 200, {
    cacheControl: "public, max-age=60",
  });
}
