import { expect, test } from '@playwright/test'

test('home 200 e título contém Manager', async ({ page }) => {
  const res = await page.goto('/')
  expect(res?.ok()).toBeTruthy()
  await expect(page).toHaveTitle(/Manager/i)
})

test('hero e CTA visíveis (pixel do copy estático)', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.hero')).toBeVisible()
  await expect(page.getByRole('heading', { name: /issues de negócio/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /ver o fluxo/i })).toBeVisible()
  await expect(page.locator('#fluxo')).toBeVisible()
  await expect(page.locator('.flow li')).toHaveCount(6)
})

test('sem console error de 5xx', async ({ page }) => {
  const bad: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /5\d\d/.test(msg.text())) bad.push(msg.text())
  })
  page.on('response', (res) => {
    if (res.status() >= 500) bad.push(`${res.status()} ${res.url()}`)
  })
  await page.goto('/')
  expect(bad, bad.join('\n')).toEqual([])
})

test('layout não estoura no viewport', async ({ page }) => {
  await page.goto('/')
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  )
  expect(overflow).toBeFalsy()
})

test('CTA e GitHub não 404', async ({ page, request }) => {
  await page.goto('/')
  const cta = page.getByRole('link', { name: /ver o fluxo/i })
  const gh = page.getByRole('link', { name: /^github$/i }).first()
  await expect(cta).toBeVisible()
  await expect(gh).toBeVisible()
  const ctaHref = await cta.getAttribute('href')
  const ghHref = await gh.getAttribute('href')
  expect(ctaHref).toBeTruthy()
  if (ctaHref?.startsWith('http')) {
    const r = await request.get(ctaHref)
    expect(r.status(), ctaHref).toBeLessThan(400)
  } else {
    await cta.click()
    await expect(page.locator('#fluxo')).toBeVisible()
  }
  const ghRes = await request.get(ghHref!, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ManagerQA/1.0)' },
  })
  expect(ghRes.status(), ghHref ?? '').toBeLessThan(400)
})

test('/admin pede login', async ({ page }) => {
  const res = await page.goto('/admin', { waitUntil: 'domcontentloaded' })
  expect(res?.status()).toBeLessThan(500)
  // Payload redireciona client-side para /admin/login ou /admin/create-first-user
  const authField = page.locator('input[name="email"], input[type="email"]').first()
  await expect(authField).toBeVisible({ timeout: 45_000 })
  await expect(page.locator('input[name="password"], input[type="password"]').first()).toBeVisible()
  await expect(page).toHaveURL(/\/admin/)
})
