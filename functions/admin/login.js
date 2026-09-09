import { authConfigured, createSessionToken, sessionCookieHeader, verifyCredentials } from "../_lib/auth.js";
import { escapeHtml, htmlResponse, page, redirect } from "../_lib/html.js";
import { checkLoginRate, clientIp, hitLoginRate } from "../_lib/rate-limit.js";

function loginNav() {
  return `<nav>
    <a href="/">Blog</a>
    <a href="/manager">Manager</a>
  </nav>`;
}

/**
 * @param {{ request: Request, env: Record<string, string> & { BLOG: KVNamespace } }} context
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const next = url.searchParams.get("next") || "/admin";

  let message = "";
  if (error === "1") message = `<p class="form-error" role="alert">Credenciais inválidas.</p>`;
  if (error === "rate") message = `<p class="form-error" role="alert">Muitas tentativas. Tente novamente em alguns minutos.</p>`;
  if (error === "config") message = `<p class="form-error" role="alert">Admin não configurado (env vars ausentes).</p>`;

  const body = `
    <section class="hero" aria-labelledby="login-title">
      <p class="kicker">Admin</p>
      <h1 id="login-title">Entrar</h1>
      <p class="lede">Acesso restrito à área editorial.</p>
    </section>
    ${message}
    <form class="admin-form" method="post" action="/admin/login">
      <input type="hidden" name="next" value="${escapeHtml(next)}" />
      <label>
        E-mail
        <input type="email" name="email" autocomplete="username" required />
      </label>
      <label>
        Senha
        <input type="password" name="password" autocomplete="current-password" required />
      </label>
      <button class="cta" type="submit">Entrar</button>
    </form>`;

  return htmlResponse(page({ title: "Login — Admin", body, nav: loginNav() }));
}

/**
 * @param {{ request: Request, env: Record<string, string> & { BLOG: KVNamespace } }} context
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (!authConfigured(env)) {
    return redirect("/admin/login?error=config");
  }

  const ip = clientIp(request);
  const rate = await checkLoginRate(env.BLOG, ip);
  if (!rate.allowed) {
    return redirect("/admin/login?error=rate");
  }

  const form = await request.formData();
  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");
  const nextRaw = String(form.get("next") || "/admin");
  const next = nextRaw.startsWith("/admin") ? nextRaw : "/admin";

  if (!verifyCredentials(env, email, password)) {
    await hitLoginRate(env.BLOG, ip);
    return redirect("/admin/login?error=1");
  }

  const token = await createSessionToken(env, email.trim().toLowerCase());
  return new Response(null, {
    status: 302,
    headers: {
      location: next,
      "set-cookie": sessionCookieHeader(token, url),
    },
  });
}
