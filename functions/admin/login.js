import { authConfigured, createSessionToken, sessionCookieHeader, verifyCredentials } from "../_lib/auth.js";
import { escapeHtml, htmlResponse, page, redirect } from "../_lib/html.js";
import { clearLoginRate, clientIp, consumeLoginAttempt } from "../_lib/rate-limit.js";

function loginNav() {
  return `<nav>
    <a href="/">Blog</a>
    <a href="/manager">Manager</a>
  </nav>`;
}

/** @param {string} error @param {string} next */
function loginRedirect(error, next) {
  const q = new URLSearchParams();
  q.set("error", error);
  if (next && next !== "/admin") q.set("next", next);
  return redirect(`/admin/login?${q}`);
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

  const form = await request.formData();
  const nextRaw = String(form.get("next") || "/admin");
  const next = nextRaw.startsWith("/admin") ? nextRaw : "/admin";

  if (!authConfigured(env)) {
    return loginRedirect("config", next);
  }

  const ip = clientIp(request);
  const rate = await consumeLoginAttempt(env.BLOG, ip);
  if (!rate.allowed) {
    return loginRedirect("rate", next);
  }

  const email = String(form.get("email") || "");
  const password = String(form.get("password") || "");

  if (!verifyCredentials(env, email, password)) {
    return loginRedirect("1", next);
  }

  await clearLoginRate(env.BLOG, ip);
  const token = await createSessionToken(env, email.trim().toLowerCase());
  return new Response(null, {
    status: 302,
    headers: {
      location: next,
      "set-cookie": sessionCookieHeader(token, url),
    },
  });
}
