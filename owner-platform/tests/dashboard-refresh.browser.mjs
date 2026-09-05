import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { chromium } from 'playwright'

const base = 'http://127.0.0.1:3011'
const { OWNER_QA_EMAIL: email, OWNER_QA_PASSWORD: password } = process.env
if (!email?.endsWith('@example.invalid') || !password) throw new Error('Use an isolated synthetic QA owner.')
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext()
  const request = context.request
  const login = await request.post(`${base}/api/users/login`, { data: { email, password }, timeout: 120_000 })
  assert.equal(login.status(), 200)
  const suffix = randomUUID()
  const brandResponse = await request.post(`${base}/api/brand-profiles`, { data: {
    name: `QA dashboard ${suffix}`, slug: `qa-${suffix}`, _status: 'published',
    colors: [
      { role: 'background', value: '#000000' }, { role: 'surface', value: '#111111' },
      { role: 'text', value: '#FFFFFF' }, { role: 'mutedText', value: '#AAAAAA' },
      { role: 'accent', value: '#FF4B44' }, { role: 'interaction', value: '#00D4E6' },
      { role: 'success', value: '#21A366' }, { role: 'danger', value: '#FF4B44' },
    ],
    usageWeights: [{ role: 'background', weight: 70 }, { role: 'surface', weight: 20 }, { role: 'text', weight: 8 }, { role: 'accent', weight: 2 }],
    motion: { duration: 600, stagger: 80, travel: 24, easing: 'ease-out', reducedMotion: 'reduce' },
  } })
  assert.equal(brandResponse.status(), 201)
  const brandId = (await brandResponse.json()).doc.id
  const pageResponse = await request.post(`${base}/api/pages?draft=true`, { data: {
    title: `QA dashboard ${suffix}`, slug: `qa-${suffix}`, brandProfile: brandId, layout: [{ blockType: 'hero', heading: 'QA only' }],
  } })
  assert.equal(pageResponse.status(), 201)
  const pageId = (await pageResponse.json()).doc.id
  const page = await context.newPage()
  const revokedRefresh = process.env.OWNER_QA_FAIL_REFRESH === '403'
  const failRefresh = process.env.OWNER_QA_FAIL_REFRESH === '1' || revokedRefresh
  let failNextRefresh = false
  if (failRefresh) {
    await page.route('**/api/owner/dashboard', (route) => {
      if (!failNextRefresh) return route.continue()
      failNextRefresh = false
      return route.fulfill({ status: revokedRefresh ? 403 : 503, contentType: 'application/json', body: '{"error":"QA unavailable"}' })
    })
  }
  await page.goto(`${base}/admin`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
  const overview = page.getByRole('region', { name: 'Estado editorial' })
  await overview.waitFor()
  const capture = overview.locator('details').filter({ has: page.locator('summary', { hasText: 'Capturar revisión de una página' }) })
  await capture.locator('summary').click()
  await capture.locator('select[name=page]').selectOption({ label: `QA dashboard ${suffix} · /qa-${suffix}` })
  await capture.getByRole('button', { name: 'Crear par de snapshots' }).click()
  await capture.getByRole('status').filter({ hasText: 'Par de snapshots creado' }).waitFor()
  const registration = overview.locator('details').filter({ has: page.locator('summary', { hasText: 'Registrar versión verificada' }) })
  await registration.locator('summary').click()
  const evidence = registration.locator('select[name=evidence]')
  await evidence.waitFor()
  const option = await evidence.locator('option').filter({ hasText: `Página ${pageId} ·` }).first().getAttribute('value')
  assert.notEqual(option, null)
  await evidence.selectOption(option)
  const name = `QA release ${suffix}`
  // Synthetic identity: no real Git object or quality certification is claimed.
  for (const [field, value] of Object.entries({ name, gitCommit: randomBytes(20).toString('hex'), performance: '80', usability: '80', accessibility: '80', confirmation: 'REGISTRAR VERSIÓN', measuredAt: new Date().toISOString().slice(0, 16) })) {
    await registration.locator(`input[name=${field}]`).fill(value)
  }
  await registration.locator('textarea[name=changeSummary]').fill('Synthetic QA measurement, not production evidence')
  await registration.locator('select[name=source]').selectOption('manual')
  const saved = page.waitForResponse((response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/owner/releases')
  failNextRefresh = failRefresh
  await registration.getByRole('button', { name: 'Registrar versión', exact: true }).click()
  assert.equal((await saved).status(), 201)
  if (revokedRefresh) {
    await overview.waitFor({ state: 'hidden' })
    await page.getByRole('button', { name: 'Reintentar resumen' }).waitFor()
    assert.equal(await page.getByRole('link').filter({ hasText: name }).count(), 0, 'Authorization failure must clear private summary data')
    console.log('PASS: authorization failure clears the private overview instead of retaining stale authenticated data.')
  } else {
    await registration.getByRole('link', { name: 'Ver versión inmutable' }).waitFor()
    if (failRefresh) {
      await overview.getByRole('status').filter({ hasText: 'No se pudo actualizar el resumen' }).waitFor({ timeout: 10_000 })
      assert.equal(await registration.locator('input[name=name]').inputValue(), name, 'A failed summary refresh must not discard the successful form')
      await overview.getByRole('button', { name: 'Reintentar resumen' }).click()
    }
    await overview.getByRole('link').filter({ hasText: name }).waitFor({ timeout: 10_000 })
    assert.equal(await registration.locator('input[name=name]').inputValue(), name, 'Refreshing the summary must not remount active forms')
    console.log('PASS: a genuinely registered QA release appears in the existing dashboard without a reload or lost form values.')
  }
} finally {
  await browser.close()
}
