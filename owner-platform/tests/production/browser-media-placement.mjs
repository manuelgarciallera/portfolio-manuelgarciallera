import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { verifyBrowserMediaPage } from './browser-media-page.mjs'

export const verifyBrowserMediaPlacement = async ({ page, origin, width }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  const suffix = randomUUID()
  const bytes = await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#34664B' } }).png().toBuffer()
  await page.goto(`${origin}/admin/collections/media/create`, { waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  await page.locator('#field-alt').fill(`Native crop QA ${suffix}`)
  await page.locator('input[type="file"]').setInputFiles({ name: `crop-${suffix}.png`, mimeType: 'image/png', buffer: bytes })
  const uploadPending = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/media')
    .then(response => ({ response }), error => ({ error }))
  await page.locator('#action-save-draft').press('Enter')
  const uploadResult = await uploadPending
  if ('error' in uploadResult) throw uploadResult.error
  assert.equal(uploadResult.response.status(), 201, 'Upload through native media form')
  const media = (await uploadResult.response.json()).doc
  await page.waitForURL(url => url.pathname === `/admin/collections/media/${media.id}`)
  const originalURL = new URL(media.url, origin)
  assert.equal(originalURL.origin, origin)
  // Use the already certificate-pinned browser, not Playwright's independent
  // Node request client (which does not inherit that narrowly scoped TLS pin).
  const originalDigest = () => page.evaluate(async url => {
    if (new URL(url).origin !== location.origin) throw new Error('Unexpected media origin')
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error(`Original media unavailable ${response.status}`)
    const bytes = await response.arrayBuffer()
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return { bytes: bytes.byteLength, sha256: [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('') }
  }, originalURL.href)
  const originalBytes = await originalDigest()
  assert(originalBytes.bytes > 0)
  await page.goto(`${origin}/admin/collections/media-placements/create`, { waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  const placementName = `Native placement QA ${suffix}`
  await page.locator('#field-name').fill(placementName)
  await page.locator('#field-placement__asset .upload__listToggler').click()
  // The native table selects via the filename button; alt is a separate cell.
  await page.locator('.list-drawer').getByRole('row').filter({ hasText: media.alt })
    .getByRole('button', { name: media.filename }).press('Enter')
  // Selection awaits document population before updating the field and closing
  // the focus-trapping drawer. Key dispatch alone does not finish that work.
  await page.locator('.list-drawer').waitFor({ state: 'hidden' })
  await page.locator('#field-placement__asset').getByRole('img', { name: media.alt, exact: true }).waitFor()
  const creation = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/media-placements')
    .then(response => ({ response }), error => ({ error }))
  await page.locator('#action-save-draft').press('Enter')
  const created = await creation
  if ('error' in created) throw created.error
  assert.equal(created.response.status(), 201, 'Create placement through native form and asset picker')
  const placement = (await created.response.json()).doc
  assert.equal(placement.name, placementName)
  assert.equal(typeof placement.placement.asset === 'object' ? placement.placement.asset.id : placement.placement.asset, media.id)
  await page.waitForURL(url => url.pathname === `/admin/collections/media-placements/${placement.id}`)
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  const editor = page.getByRole('region', { name: 'Encuadre reversible' })
  const image = editor.getByRole('img', { name: media.alt, exact: true })
  try { await image.waitFor() } catch (error) {
    console.error('[media-placement] preview diagnostic', await editor.innerText())
    console.error('[media-placement] selected asset diagnostic', await page.evaluate(async id => {
      const response = await fetch(`/api/media/${id}?depth=0`)
      return { status: response.status, body: await response.text() }
    }, media.id))
    throw error
  }
  await image.evaluate(element => element.decode())
  const horizontal = editor.getByRole('slider', { name: /Punto focal horizontal/ })
  await horizontal.press('End')
  assert.equal(await horizontal.inputValue(), '100')
  await editor.getByRole('button', { name: 'Mobile', exact: true }).click()
  const vertical = editor.getByRole('slider', { name: /Punto focal vertical/ })
  const zoom = editor.getByRole('slider', { name: /^Zoom/ })
  await vertical.press('Home')
  await zoom.press('End')
  await editor.getByRole('combobox', { name: 'Proporción', exact: true }).selectOption('1:1')

  let release
  let notifyPending
  const gate = new Promise(resolve => { release = resolve })
  const pending = new Promise(resolve => { notifyPending = resolve })
  const holdSave = async route => {
    if (route.request().method() !== 'PATCH') return route.continue()
    notifyPending()
    await gate
    await route.continue()
  }
  const endpoint = `${origin}/api/media-placements/${placement.id}`
  await page.route(`${endpoint}*`, holdSave)
  const saving = page.waitForResponse(response => response.request().method() === 'PATCH' && new URL(response.url()).pathname === `/api/media-placements/${placement.id}`)
    .then(response => ({ response }), error => ({ error }))
  let timer
  try {
    await page.locator('#action-save-draft').press('Enter')
    await Promise.race([pending, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Placement save not requested')), 10_000) })])
    const disabledWhileSaving = await editor.locator('input[type="range"], select').evaluateAll(elements => elements.map(element => element.disabled))
    release()
    const result = await saving
    if ('error' in result) throw result.error
    assert.equal(result.response.status(), 200)
    assert.deepEqual(disabledWhileSaving, [true, true, true, true, true], 'Do not accept crop edits while the native form is saving')
  } finally { release(); clearTimeout(timer); await page.unroute(`${endpoint}*`, holdSave) }
  await page.waitForFunction(() => {
    const controls = document.querySelectorAll('section[aria-labelledby="media-placement-editor-title"] input[type="range"], section[aria-labelledby="media-placement-editor-title"] select')
    return controls.length === 5 && [...controls].every(element => !element.disabled)
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  assert.deepEqual(await editor.locator('input[type="range"], select').evaluateAll(elements => elements.map(element => element.disabled)),
    [false, false, false, false, false], 'All crop controls become editable again')
  assert.equal(await horizontal.inputValue(), '100')
  assert.equal(await zoom.inputValue(), '1', 'Desktop zoom remains independent')
  await editor.getByRole('button', { name: 'Mobile', exact: true }).click()
  assert.equal(await vertical.inputValue(), '0')
  assert.equal(await zoom.inputValue(), '4')
  assert.equal(await editor.getByRole('combobox', { name: 'Proporción', exact: true }).inputValue(), '1:1')
  assert.equal(await page.locator('#action-save-draft').isDisabled(), true, 'Changing preview viewport alone is not an edit')
  await image.waitFor()
  await image.evaluate(element => element.decode())
  assert.equal(await image.evaluate(element => element.style.objectPosition), '100% 0%')
  assert.equal(await image.evaluate(element => element.style.transform), 'scale(4)')
  const unchanged = await page.evaluate(async id => {
    const response = await fetch(`/api/media/${id}?draft=true&depth=0`, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error('Cannot reread original media')
    return response.json()
  }, media.id)
  assert.equal(unchanged.storageRevision, media.storageRevision, 'A placement edit must not replace original media')
  assert.deepEqual(await originalDigest(), originalBytes, 'Crop editing preserves actual original bytes, including legacy storage')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  console.log(`[media-placement] PASS ${width}px native upload and placement creation, crop save/reload, independent mobile recipe and original preserved`)
  return verifyBrowserMediaPage({ page, origin, width, media, placement })
}
