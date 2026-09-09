import { listPublished } from "./_lib/posts.js";
import { ensureSeed } from "./_lib/seed.js";

/** Escapa terminador CDATA para não quebrar o XML. */
function cdata(s) {
  return String(s).replace(/]]>/g, "]]]]><![CDATA[>");
}

/**
 * @param {{ request: Request, env: { BLOG: KVNamespace } }} context
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  await ensureSeed(env.BLOG);
  const posts = await listPublished(env.BLOG);
  const origin = new URL(request.url).origin;

  const items = posts
    .map((p) => {
      const link = `${origin}/post/${encodeURIComponent(p.slug)}`;
      return `<item>
  <title><![CDATA[${cdata(p.title)}]]></title>
  <link>${link}</link>
  <guid isPermaLink="true">${link}</guid>
  <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
  <description><![CDATA[${cdata(p.excerpt)}]]></description>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Blog do Manager</title>
  <link>${origin}/</link>
  <description>Posts publicados do Manager</description>
  <language>pt-BR</language>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=60",
    },
  });
}
