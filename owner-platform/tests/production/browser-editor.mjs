import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { verifySecondPage } from './browser-second-page.mjs'
import { verifyBrowserMediaPlacement } from './browser-media-placement.mjs'
import { verifyBrowserPublication } from './browser-publication.mjs'
import { verifyBrowserArticle } from './browser-article.mjs'
import { verifyUnsavedPage } from './browser-unsaved.mjs'

export const verifyProductionBrowserEditor = async ({ page, context, origin, width }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  // A native draft must save without a brand and retain the entered content.
  // No API writes, real brand, uploaded asset or public page prepare this test.
  const suffix = randomUUID()
  await page.goto(`${origin}/admin/collections/brand-profiles/create`, { waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  await page.locator('#field-name').fill(`Typography QA ${suffix}`)
  await page.locator('#field-slug').fill(`typography-qa-${suffix}`)
  const familyInput = page.getByRole('textbox', { name: 'Familia de títulos', exact: true })
  const familySelect = page.getByRole('combobox', { name: 'Elegir estilo · Familia de títulos', exact: true })
  await familyInput.fill('Custom Family')
  assert.equal(await familySelect.inputValue(), 'Custom Family', 'Existing/custom families must remain selectable without overwriting them')
  await familySelect.selectOption('Georgia')
  assert.equal(await familyInput.inputValue(), 'Georgia', 'Selecting a family must update the real Payload field')
  const sample = page.getByRole('img', { name: 'Muestra de Familia de títulos: Georgia', exact: true })
  assert.match(await sample.evaluate(element => getComputedStyle(element).fontFamily), /Georgia/)
  await page.getByRole('combobox', { name: 'Elegir estilo · Familia del cuerpo', exact: true }).selectOption('monospace')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Typography controls fit mobile and desktop')
  let releaseBrandSave
  let markBrandSavePending
  const brandSaveGate = new Promise(resolve => { releaseBrandSave = resolve })
  const brandSavePending = new Promise(resolve => { markBrandSavePending = resolve })
  const holdBrandSave = async route => {
    if (route.request().method() !== 'POST') return route.continue()
    markBrandSavePending()
    await brandSaveGate
    await route.continue()
  }
  await page.route(`${origin}/api/brand-profiles*`, holdBrandSave)
  const brandSaving = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/brand-profiles')
    .then(response => ({ response }), error => ({ error }))
  let pendingTimeout
  let brandResponse
  try {
    await page.locator('#action-save-draft').press('Enter')
    await Promise.race([brandSavePending, new Promise((_, reject) => { pendingTimeout = setTimeout(() => reject(new Error('Brand save was not requested')), 10_000) })])
    assert.equal(await familySelect.isDisabled(), true, 'Freeze selection while the actual form save is pending')
    releaseBrandSave()
    const result = await brandSaving
    if ('error' in result) throw result.error
    brandResponse = result.response
  } finally {
    releaseBrandSave()
    clearTimeout(pendingTimeout)
    await page.unroute(`${origin}/api/brand-profiles*`, holdBrandSave)
  }
  assert.equal(brandResponse.status(), 201)
  const { doc: brand } = await brandResponse.json()
  await page.waitForURL(url => url.pathname === `/admin/collections/brand-profiles/${brand.id}`)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  assert.equal(await familyInput.inputValue(), 'Georgia', 'Selected heading family persists after reload')
  assert.equal(await page.getByRole('textbox', { name: 'Familia del cuerpo', exact: true }).inputValue(), 'monospace')
  if (process.env.OWNER_TYPOGRAPHY_SCREENSHOTS === '1') {
    await sample.scrollIntoViewIfNeeded()
    await page.screenshot({ path: `/tmp/owner-typography-${width}.png` })
  }
  const initialTitle = `Editor QA ${suffix}`
  const initialSlug = `editor-qa-${suffix}`
  await page.goto(`${origin}/admin/collections/pages/create`, { waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  await page.getByRole('textbox', { name: /^Título de la página/ }).fill(initialTitle)
  await page.getByRole('textbox', { name: /^Identificador de URL \(slug\)/ }).fill(initialSlug)
  for (const [index, heading] of ['First draft block', 'Second draft block'].entries()) {
    await page.locator('.blocks-field__drawer-toggler').press('Enter')
    await page.getByRole('button', { name: 'Portada', exact: true }).click()
    await page.getByRole('textbox', { name: /^Encabezado/ }).nth(index).fill(heading)
  }
  const creating = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/pages')
  await page.locator('#action-save-draft').press('Enter')
  const created = await creating
  assert.equal(created.status(), 201, 'Create draft without a brand through the actual Payload form')
  const { doc } = await created.json()
  const id = doc.id
  assert(id !== undefined && id !== null, 'Native creation returns a document ID')
  await page.waitForURL(url => url.pathname === `/admin/collections/pages/${id}`)
  const initial = await page.evaluate(async id => {
    const response = await fetch(`/api/pages/${id}?draft=true&depth=0`, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error('Cannot reread natively created draft')
    return response.json()
  }, id)
  assert.equal(initial._status, 'draft')
  assert.equal(initial.title, initialTitle)
  assert.equal(initial.slug, initialSlug)
  assert.equal(initial.brandProfile ?? null, null)
  assert.deepEqual(initial.layout.map(block => ({ blockType: block.blockType, heading: block.heading })), [
    { blockType: 'hero', heading: 'First draft block' },
    { blockType: 'hero', heading: 'Second draft block' },
  ])
  const expectedTitle = `Edited in browser ${width}`
  await page.goto(`${origin}/admin/collections/pages/${id}`, { waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  const title = page.getByRole('textbox', { name: /^Título de la página/ })
  await title.fill(expectedTitle)
  const headings = page.getByRole('textbox', { name: /^Encabezado/ })
  assert.equal(await headings.count(), 2)
  await headings.first().fill('Edited first block')
  // Keyboard alternative to drag-and-drop is essential on touch and for
  // assistive technology. Exercise native controls, not DOM state mutation.
  await page.locator('.blocks-field .array-actions__button').nth(1).press('Enter')
  await page.locator('.array-actions__move-up').press('Enter')
  assert.equal(await headings.first().inputValue(), 'Second draft block')
  const saving = page.waitForResponse(response => response.request().method() === 'PATCH' && new URL(response.url()).pathname === `/api/pages/${id}`)
  await page.locator('#action-save-draft').press('Enter')
  assert.equal((await saving).status(), 200, 'Save through the actual Payload form')
  await page.waitForFunction(() => document.querySelector('#action-save-draft')?.disabled === true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  assert.equal(await title.inputValue(), expectedTitle)
  assert.deepEqual(await headings.evaluateAll(elements => elements.map(element => element.value)), ['Second draft block', 'Edited first block'])
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Editor must not overflow horizontally')
  const popup = context.waitForEvent('page')
  await page.getByRole('link', { name: /Ver borrador guardado/ }).press('Enter')
  const preview = await popup
  try {
    await preview.waitForURL(`${origin}/admin/content-preview/pages/${id}`)
    await preview.getByRole('heading', { name: 'Second draft block', exact: true }).waitFor()
    assert.deepEqual(await preview.locator('article [data-block-type="hero"] :is(h1,h2)').allTextContents(), ['Second draft block', 'Edited first block'])
    assert.equal(await preview.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  } finally { await preview.close() }
  const stored = await page.evaluate(async (id) => {
    const response = await fetch(`/api/pages/${id}?draft=true&depth=0`, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error('Cannot reread saved browser draft')
    return response.json()
  }, id)
  assert.equal(stored._status, 'draft')
  assert.equal(stored.title, expectedTitle)
  assert.equal(stored.slug, initialSlug)
  assert.equal(stored.brandProfile ?? null, null)
  assert.deepEqual(stored.layout.map(block => block.heading), ['Second draft block', 'Edited first block'])
  const second = await verifySecondPage({ page, context, origin, width, firstPage: stored })
  await verifyUnsavedPage({ page, origin, width, document: stored })
  const mediaPage = await verifyBrowserMediaPlacement({ page, origin, width })
  await verifyBrowserPublication({ page, origin, document: second, width })
  await verifyBrowserArticle({ page, context, origin, width, mediaPage })
  console.log(`[production-editor] PASS ${width}px native create, edit, keyboard reorder, save, reload and preview`)
  return [stored, second, mediaPage]
}
