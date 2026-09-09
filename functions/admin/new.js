import { requireSession } from "../_lib/auth.js";
import { htmlResponse, logoutForm, page, redirect } from "../_lib/html.js";
import { createPost } from "../_lib/posts.js";

function adminNav() {
  return `<nav>
    <a href="/admin">Posts</a>
    ${logoutForm()}
  </nav>`;
}

/**
 * @param {{ request: Request, env: Record<string, string> & { BLOG: KVNamespace } }} context
 */
export async function onRequestGet(context) {
  const gate = await requireSession(context.env, context.request);
  if (gate.response) return gate.response;

  const body = `
    <section class="hero" aria-labelledby="new-title">
      <p class="kicker">Admin</p>
      <h1 id="new-title">Novo post</h1>
    </section>
    <form class="admin-form" method="post" action="/admin/new">
      <label>
        Título
        <input type="text" name="title" required maxlength="200" />
      </label>
      <label>
        Resumo
        <input type="text" name="excerpt" maxlength="300" />
      </label>
      <label>
        Corpo (Markdown)
        <textarea name="body" rows="14" required></textarea>
      </label>
      <label class="check">
        <input type="checkbox" name="published" value="1" checked />
        Publicar agora
      </label>
      <button class="cta" type="submit">Criar</button>
    </form>`;

  return htmlResponse(page({ title: "Novo post — Admin", body, nav: adminNav() }));
}

/**
 * @param {{ request: Request, env: Record<string, string> & { BLOG: KVNamespace } }} context
 */
export async function onRequestPost(context) {
  const gate = await requireSession(context.env, context.request);
  if (gate.response) return gate.response;

  const form = await context.request.formData();
  const title = String(form.get("title") || "").trim();
  const excerpt = String(form.get("excerpt") || "");
  const body = String(form.get("body") || "");
  const published = form.get("published") === "1";

  if (!title || !body.trim()) {
    return redirect("/admin/new");
  }

  const post = await createPost(context.env.BLOG, {
    title,
    excerpt,
    body: body.trim(),
    published,
  });
  return redirect(`/admin/edit/${encodeURIComponent(post.id)}`);
}
