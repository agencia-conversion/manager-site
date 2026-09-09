/** @param {string} s */
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Form POST de logout (evita CSRF via GET). */
export function logoutForm() {
  return `<form class="nav-logout" method="post" action="/admin/logout">
    <button type="submit">Sair</button>
  </form>`;
}

/**
 * @param {{ title: string, body: string, nav?: string }} opts
 */
export function page({ title, body, nav }) {
  const navHtml =
    nav ??
    `<nav>
      <a href="/">Blog</a>
      <a href="/manager">Manager</a>
      <a href="/admin">Admin</a>
      <a href="/rss.xml">RSS</a>
    </nav>`;

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <header class="top">
      <a class="mark" href="/">MANAGER</a>
      ${navHtml}
    </header>
    <main>
      ${body}
    </main>
    <footer>
      <p>Manager · blog via Cloudflare Pages Functions + KV</p>
    </footer>
  </body>
</html>`;
}

/**
 * @param {string} html
 * @param {number} [status]
 * @param {{ cacheControl?: string }} [opts]
 */
export function htmlResponse(html, status = 200, opts = {}) {
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": opts.cacheControl ?? "no-store",
    },
  });
}

/** @param {string} location */
export function redirect(location, status = 302) {
  return new Response(null, {
    status,
    headers: { location },
  });
}
