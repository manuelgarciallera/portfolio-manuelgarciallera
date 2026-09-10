import assert from 'node:assert/strict'
import { chromium } from 'playwright'

// Fresh isolated Next QA server + seed-workflow-qa.mjs only. No image fixtures:
// binary restoration is covered separately by the full-config integration test.
const base = 'http://127.0.0.1:3013'
const { OWNER_QA_EMAIL: email, OWNER_QA_PASSWORD: password } = process.env
if (!email?.endsWith('@example.invalid') || !password) throw new Error('Synthetic QA credentials required')
const browser = await chromium.launch({ headless: true })
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, extraHTTPHeaders: { Origin: base } })
    try {
      assert.equal((await context.request.post(`${base}/api/users/login`, { data: { email, password } })).status(), 200)
      const post = async (path, data) => {
        const response = await context.request.post(base + path, { data })
        assert(response.ok(), `${path}: ${response.status()}`)
        return response.json()
      }
      const { plan } = await post('/api/owner/releases/1/restore-plans', { confirmation: 'PREPARAR RESTAURACIÓN' })
      const { snapshot } = await post('/api/owner/preview-snapshots', { pageId: 1 })
      assert.equal((await context.request.patch(`${base}/api/owner/restore-plans/${plan.id}/confirm`, { data: { confirmation: 'CONFIRMAR RESTAURACIÓN', currentSnapshot: snapshot.id } })).status(), 200)
      await post(`/api/owner/restore-plans/${plan.id}/execute`, { confirmation: 'EJECUTAR RESTAURACIÓN' })
      const page = await context.newPage()
      page.setDefaultTimeout(60000)
      const errors = []
      page.on('pageerror', error => { errors.push(error.message); console.error(error.message) })
      page.on('console', message => { if (message.type() === 'error') console.error(message.text()) })
      await page.goto(`${base}/admin/collections/pages/1`, { timeout: 60000 })
      const checkbox = page.getByRole('checkbox', { name: 'Usar las imágenes actuales de la biblioteca' })
      await page.getByRole('link', { name: 'Ver borrador guardado' }).waitFor({ timeout: 60000 })
      await checkbox.waitFor({ timeout: 60000 })
      const readDraft = async () => (await context.request.get(`${base}/api/pages/1?draft=true&depth=0`)).json()
      const before = await readDraft()
      assert(before.restoredMediaSnapshot)
      try { await checkbox.check({ timeout: 15000 }) } catch (error) {
        console.log(JSON.stringify(await page.locator('form').evaluateAll(forms => forms.map(form => ({ ready: form.dataset.formReady, inputs: [...form.querySelectorAll('input')].map(input => ({ name: input.name, disabled: input.disabled })) })))))
        console.log(await page.locator('body').innerText())
        await page.screenshot({ path: 'node_modules/.cache/restored-media-disabled.png', fullPage: true })
        throw error
      }
      const title = `Current library QA ${width}`
      await page.getByRole('textbox', { name: 'Title *', exact: true }).fill(title)
      assert.equal((await readDraft()).restoredMediaSnapshot, before.restoredMediaSnapshot)
      await page.screenshot({ path: `node_modules/.cache/restored-media-control-${width}.png`, fullPage: true })
      const saved = page.waitForResponse(response => response.url().includes('/api/pages/1') && response.request().method() === 'PATCH')
      await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click()
      assert.equal((await saved).status(), 200)
      const after = await readDraft()
      assert.equal(after.restoredMediaSnapshot, null)
      assert.equal(after.title, title)
      assert.equal(after._status, 'draft')
      await checkbox.waitFor({ state: 'hidden' })
      assert.deepEqual(errors, [])
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      console.log(JSON.stringify({ width, savedTitle: title, clearedSnapshot: true, pageErrors: errors }))
    } finally { await context.close() }
  }
} finally { await browser.close() }
