import { expect, test } from "@playwright/test";

test("home 200 lista posts publicados", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Blog|Manager/i);
  await expect(page.getByRole("heading", { level: 1, name: /blog do manager/i })).toBeVisible();
  await expect(page.locator(".post-list li").first()).toBeVisible();
});

test("post de exemplo abre com título e corpo", async ({ page }) => {
  await page.goto("/");
  const first = page.locator(".post-list a").first();
  await expect(first).toBeVisible();
  await first.click();
  await expect(page).toHaveURL(/\/post\//);
  await expect(page.locator("article.post h1")).toBeVisible();
  await expect(page.locator("article.post .prose")).toBeVisible();
});

test("slug inexistente retorna 404", async ({ request }) => {
  const res = await request.get("/post/nao-existe-xyz");
  expect(res.status()).toBe(404);
});

test("manager preserva landing", async ({ page }) => {
  const res = await page.goto("/manager");
  expect(res?.ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: /issues de negócio/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /ver o fluxo/i })).toBeVisible();
});

test("rss.xml é XML com items", async ({ request }) => {
  const res = await request.get("/rss.xml");
  expect(res.ok()).toBeTruthy();
  const ct = res.headers()["content-type"] || "";
  expect(ct).toMatch(/xml/i);
  const body = await res.text();
  expect(body).toContain("<rss");
  expect(body).toContain("<item>");
});

test("admin sem sessão redireciona para login", async ({ page }) => {
  const res = await page.goto("/admin");
  expect(res?.ok()).toBeTruthy();
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: /entrar/i })).toBeVisible();
});

test("login inválido mostra erro genérico", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill('input[name="email"]', "errado@example.com");
  await page.fill('input[name="password"]', "senha-errada");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("alert")).toContainText(/credenciais inválidas/i);
});

test("login correto entra e criar post aparece na home", async ({ page }) => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  test.skip(!email || !password, "ADMIN_EMAIL/ADMIN_PASSWORD necessários");

  await page.goto("/admin/login");
  await page.fill('input[name="email"]', email!);
  await page.fill('input[name="password"]', password!);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin\/?$/);
  await expect(page.getByRole("heading", { name: /^posts$/i })).toBeVisible();

  const title = `Post QA ${Date.now()}`;
  await page.goto("/admin/new");
  await page.fill('input[name="title"]', title);
  await page.fill('input[name="excerpt"]', "Resumo do post de QA");
  await page.fill('textarea[name="body"]', "## Olá\n\nCorpo do post de QA.");
  await page.locator('input[name="published"]').check();
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin\/edit\//);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
});

test("sem console error de 5xx na home", async ({ page }) => {
  const bad: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" && /5\d\d/.test(msg.text())) bad.push(msg.text());
  });
  page.on("response", (res) => {
    if (res.status() >= 500) bad.push(`${res.status()} ${res.url()}`);
  });
  await page.goto("/");
  expect(bad, bad.join("\n")).toEqual([]);
});

test("layout não estoura no viewport", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBeFalsy();
});
