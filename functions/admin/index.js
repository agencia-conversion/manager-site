import { requireSession } from "../_lib/auth.js";
import { escapeHtml, htmlResponse, page } from "../_lib/html.js";
import { formatDate, listPosts } from "../_lib/posts.js";
import { ensureSeed } from "../_lib/seed.js";

function adminNav() {
  return `<nav>
    <a href="/">Blog</a>
    <a href="/admin/new">Novo post</a>
    <a href="/admin/logout">Sair</a>
  </nav>`;
}

/**
 * @param {{ request: Request, env: Record<string, string> & { BLOG: KVNamespace } }} context
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const gate = await requireSession(env, request);
  if (gate.response) return gate.response;

  await ensureSeed(env.BLOG);
  const posts = await listPosts(env.BLOG);

  const rows =
    posts.length === 0
      ? `<p class="lede">Nenhum post. <a href="/admin/new">Criar o primeiro</a>.</p>`
      : `<table class="admin-table">
      <thead><tr><th>Título</th><th>Status</th><th>Data</th><th></th></tr></thead>
      <tbody>
      ${posts
        .map(
          (p) => `<tr>
          <td>${escapeHtml(p.title)}</td>
          <td>${p.published ? "Publicado" : "Rascunho"}</td>
          <td>${escapeHtml(formatDate(p.createdAt))}</td>
          <td><a href="/admin/edit/${encodeURIComponent(p.id)}">Editar</a></td>
        </tr>`,
        )
        .join("")}
      </tbody></table>`;

  const body = `
    <section class="hero" aria-labelledby="admin-title">
      <p class="kicker">Admin</p>
      <h1 id="admin-title">Posts</h1>
      <p class="lede">Criar, editar, publicar e excluir.</p>
      <div class="actions">
        <a class="cta" href="/admin/new">Novo post</a>
      </div>
    </section>
    ${rows}`;

  return htmlResponse(page({ title: "Admin — Posts", body, nav: adminNav() }));
}
