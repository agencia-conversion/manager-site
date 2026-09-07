import { expect, test } from "@playwright/test";

const posts = [
  {
    slug: "workers-qa-preview",
    title: /workers, qa e preview/i,
  },
  {
    slug: "brief-aprovado-agentes",
    title: /brief precisa da sua aprovação/i,
  },
  {
    slug: "issues-de-negocio",
    title: /issues de negócio/i,
  },
] as const;

test("home 200 lista 3 posts do mais recente", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Manager — Blog/i);

  const items = page.locator(".post-list li");
  await expect(items).toHaveCount(3);

  const hrefs = await items.locator("a").evaluateAll((as) =>
    as.map((a) => (a as HTMLAnchorElement).getAttribute("href")),
  );
  expect(hrefs).toEqual([
    "/blog/workers-qa-preview/",
    "/blog/brief-aprovado-agentes/",
    "/blog/issues-de-negocio/",
  ]);

  for (const post of posts) {
    await expect(page.getByRole("link", { name: post.title })).toBeVisible();
  }
});

test("cada post abre com título, data e corpo", async ({ page }) => {
  for (const post of posts) {
    const res = await page.goto(`/blog/${post.slug}/`);
    expect(res?.ok(), post.slug).toBeTruthy();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".article-header time")).toBeVisible();
    await expect(page.locator(".prose")).toBeVisible();
    await expect(page.getByRole("link", { name: /todos os posts/i })).toBeVisible();
  }
});

test("links internos da home e posts não 404", async ({ page, request }) => {
  await page.goto("/");
  const homeHrefs = await page.locator("a[href^='/']").evaluateAll((as) =>
    [...new Set(as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!))],
  );

  for (const href of homeHrefs) {
    const r = await request.get(href);
    expect(r.status(), href).toBeLessThan(400);
  }

  for (const post of posts) {
    await page.goto(`/blog/${post.slug}/`);
    const hrefs = await page.locator("a[href^='/']").evaluateAll((as) =>
      [...new Set(as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!))],
    );
    for (const href of hrefs) {
      const r = await request.get(href);
      expect(r.status(), `${post.slug} → ${href}`).toBeLessThan(400);
    }
  }
});

test("sobre 200 com posicionamento do Manager", async ({ page }) => {
  const res = await page.goto("/sobre/");
  expect(res?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Sobre — Manager/i);
  await expect(page.getByRole("heading", { name: /issues de negócio/i })).toBeVisible();
  await expect(page.locator(".lede")).toContainText(/orquestra Claude, Codex e Cursor/i);
  await expect(page.locator(".about-panel")).toContainText(/Você aprova o brief/i);
});

test("rss, sitemap e robots", async ({ request }) => {
  const rss = await request.get("/rss.xml");
  expect(rss.ok()).toBeTruthy();
  const rssText = await rss.text();
  expect(rssText).toMatch(/<\?xml/i);
  expect(rssText).toContain("<rss");
  for (const post of posts) {
    expect(rssText).toContain(`/blog/${post.slug}/`);
  }

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  const mapText = await sitemap.text();
  expect(mapText).toContain("https://manager-site.pages.dev/");
  expect(mapText).toContain("https://manager-site.pages.dev/sobre/");
  for (const post of posts) {
    expect(mapText).toContain(`/blog/${post.slug}/`);
  }

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  const robotsText = await robots.text();
  expect(robotsText).toMatch(/sitemap:\s*https:\/\/manager-site\.pages\.dev\/sitemap\.xml/i);
});

test("SEO: title, description e OG por página", async ({ page }) => {
  const pages = [
    { path: "/", title: /Manager — Blog/ },
    { path: "/sobre/", title: /Sobre — Manager/ },
    ...posts.map((p) => ({
      path: `/blog/${p.slug}/`,
      title: p.title,
    })),
  ];

  for (const entry of pages) {
    await page.goto(entry.path);
    await expect(page).toHaveTitle(entry.title);
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute("content", /.+/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /.+/);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      /.+/,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /.+/);
  }
});

test("sem console error de 5xx nas páginas principais", async ({ page }) => {
  const bad: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && /5\d\d/.test(msg.text())) bad.push(msg.text());
  });
  page.on("response", (res) => {
    if (res.status() >= 500) bad.push(`${res.status()} ${res.url()}`);
  });
  const paths = ["/", "/sobre/", ...posts.map((p) => `/blog/${p.slug}/`)];
  for (const path of paths) {
    await page.goto(path);
  }
  expect(bad, bad.join("\n")).toEqual([]);
});

test("layout não estoura no viewport", async ({ page }) => {
  const paths = ["/", "/sobre/", ...posts.map((p) => `/blog/${p.slug}/`)];
  for (const path of paths) {
    await page.goto(path);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow, path).toBeFalsy();
  }
});
