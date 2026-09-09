import { requireSession } from "../../_lib/auth.js";
import { escapeHtml, htmlResponse, page, redirect } from "../../_lib/html.js";
import { getPost, updatePost } from "../../_lib/posts.js";

function adminNav() {
  return `<nav>
    <a href="/admin">Posts</a>
    <a href="/admin/new">Novo</a>
    <a href="/admin/logout">Sair</a>
  </nav>`;
}

/**
 * @param {{ request: Request, env: Record<string, string> & { BLOG: KVNamespace }, params: { id: string } }} context
 */
export async function onRequestGet(context) {
  const gate = await requireSession(context.env, context.request);
  if (gate.response) return gate.response;

  const post = await getPost(context.env.BLOG, context.params.id);
  if (!post) {
    return htmlResponse(
      page({
        title: "Não encontrado",
        body: `<p class="lede">Post inexistente. <a href="/admin">Voltar</a></p>`,
        nav: adminNav(),
      }),
      404,
    );
  }

  const body = `
    <section class="hero" aria-labelledby="edit-title">
      <p class="kicker">Admin · ${escapeHtml(post.slug)}</p>
      <h1 id="edit-title">Editar post</h1>
    </section>
    <form class="admin-form" method="post" action="/admin/edit/${encodeURIComponent(post.id)}">
      <label>
        Título
        <input type="text" name="title" required maxlength="200" value="${escapeHtml(post.title)}" />
      </label>
      <label>
        Resumo
        <input type="text" name="excerpt" maxlength="300" value="${escapeHtml(post.excerpt)}" />
      </label>
      <label>
        Corpo (Markdown)
        <textarea name="body" rows="14" required>${escapeHtml(post.body)}</textarea>
      </label>
      <label class="check">
        <input type="checkbox" name="published" value="1" ${post.published ? "checked" : ""} />
        Publicado
      </label>
      <div class="actions">
        <button class="cta" type="submit">Salvar</button>
        <a class="ghost" href="/post/${encodeURIComponent(post.slug)}" target="_blank" rel="noopener">Ver</a>
      </div>
    </form>
    <form class="admin-form danger" method="post" action="/admin/delete/${encodeURIComponent(post.id)}" onsubmit="return confirm('Excluir este post?');">
      <button type="submit" class="ghost">Excluir post</button>
    </form>`;

  return htmlResponse(page({ title: `Editar — ${post.title}`, body, nav: adminNav() }));
}

/**
 * @param {{ request: Request, env: Record<string, string> & { BLOG: KVNamespace }, params: { id: string } }} context
 */
export async function onRequestPost(context) {
  const gate = await requireSession(context.env, context.request);
  if (gate.response) return gate.response;

  const form = await context.request.formData();
  const title = String(form.get("title") || "").trim();
  const excerpt = String(form.get("excerpt") || "");
  const body = String(form.get("body") || "");
  const published = form.get("published") === "1";

  if (!title || !body) {
    return redirect(`/admin/edit/${encodeURIComponent(context.params.id)}`);
  }

  await updatePost(context.env.BLOG, context.params.id, { title, excerpt, body, published });
  return redirect(`/admin/edit/${encodeURIComponent(context.params.id)}`);
}
