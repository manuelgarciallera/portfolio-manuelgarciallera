import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { chromium } from 'playwright'

// Deliberately fixed to the separately provisioned synthetic QA server.
const base = process.env.OWNER_QA_PORT === '3013' ? 'http://127.0.0.1:3013' : 'http://127.0.0.1:3011'
const { OWNER_QA_EMAIL: email, OWNER_QA_PASSWORD: password } = process.env
if (!email?.endsWith('@example.invalid') || !password) throw new Error('Use an isolated synthetic QA owner.')
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext()
  const request = context.request
  const login = await request.post(`${base}/api/users/login`, { data: { email, password } })
  assert.equal(login.status(), 200, 'QA login must succeed')
  const mediaResponse = await request.get(`${base}/api/media?limit=1&depth=0&draft=true`)
  assert.equal(mediaResponse.status(), 200)
  const media = (await mediaResponse.json()).docs[0]
  assert.ok(media?.id, 'Seed the isolated QA media first')
  const created = await request.post(`${base}/api/media-placements?draft=true`, { data: {
    name: `QA crop save ${randomUUID()}`,
    placement: { asset: media.id, focalX: .5, focalY: .5, zoom: 1, frame: '16:9', fit: 'cover', overrides: {} },
  } })
  assert.equal(created.status(), 201, 'QA placement must be created')
  const id = (await created.json()).doc.id
  const page = await context.newPage()
  await page.goto(`${base}/admin/collections/media-placements/${id}`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  const save = page.locator('#action-save-draft')
  await save.waitFor()
  assert.equal(await save.isDisabled(), true, 'An untouched saved placement is not modified')
  const editor = page.getByRole('region', { name: 'Encuadre reversible' })
  const horizontal = editor.getByRole('slider', { name: /Punto focal horizontal/ })
  await horizontal.focus()
  await horizontal.press('End')
  assert.equal(await horizontal.inputValue(), '100')
  await page.waitForFunction(() => !document.querySelector('#action-save-draft')?.disabled, undefined, { timeout: 5000 })
  const response = page.waitForResponse((response) => response.request().method() === 'PATCH' && new URL(response.url()).pathname === `/api/media-placements/${id}`)
  await save.click()
  assert.equal((await response).status(), 200, 'The actual draft-save request must succeed')
  await page.waitForFunction(() => document.querySelector('#action-save-draft')?.disabled, undefined, { timeout: 10000 })
  const saved = await request.get(`${base}/api/media-placements/${id}?draft=true&depth=0`)
  assert.equal((await saved.json()).placement.focalX, 1, 'The crop must survive an actual draft save')
  await page.reload({ waitUntil: 'domcontentloaded' })
  assert.equal(await horizontal.inputValue(), '100', 'The saved crop must survive reopening the editor')
  await editor.getByRole('button', { name: 'Mobile', exact: true }).click()
  assert.equal(await save.isDisabled(), true, 'Changing only the preview viewport must not modify the recipe')
  const vertical = editor.getByRole('slider', { name: /Punto focal vertical/ })
  await vertical.focus()
  await vertical.press('Home')
  const zoom = editor.getByRole('slider', { name: /^Zoom/ })
  await zoom.focus()
  await zoom.press('End')
  await editor.getByRole('combobox', { name: 'Ajuste' }).selectOption('contain')
  await editor.getByRole('combobox', { name: 'Proporción' }).selectOption('1:1')
  const mobileResponse = page.waitForResponse((response) => response.request().method() === 'PATCH' && new URL(response.url()).pathname === `/api/media-placements/${id}`)
  await save.click()
  assert.equal((await mobileResponse).status(), 200)
  const updated = (await (await request.get(`${base}/api/media-placements/${id}?draft=true&depth=0`)).json()).placement
  assert.equal(updated.focalX, 1)
  assert.equal(updated.focalY, .5)
  assert.equal(updated.zoom, 1)
  assert.equal(updated.fit, 'cover')
  assert.equal(updated.frame, '16:9')
  assert.deepEqual({ focalY: updated.overrides.mobile.focalY, zoom: updated.overrides.mobile.zoom, fit: updated.overrides.mobile.fit, frame: updated.overrides.mobile.frame }, { focalY: 0, zoom: 4, fit: 'contain', frame: '1:1' })
  console.log('PASS: labelled keyboard crop controls enable Save Draft, survive reload, and keep mobile overrides separate from desktop.')
} finally {
  await browser.close()
}
