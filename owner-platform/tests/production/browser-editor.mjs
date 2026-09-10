import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

export const verifyProductionBrowserEditor = async ({ page, context, origin, width }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  // Seed only a draft via the browser's real cookie session; all edits below
  // use the actual form. No real brand, uploaded asset or public page is used.
  const created = await page.evaluate(async (suffix) => {
    const response = await fetch('/api/pages?draft=true', {
      signal: AbortSignal.timeout(10_000),
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Editor QA ${suffix}`, slug: `editor-qa-${suffix}`, layout: [
        { blockType: 'hero', heading: 'First draft block' }, { blockType: 'hero', heading: 'Second draft block' },
      ] }),
    })
    return { status: response.status, data: await response.json() }
  }, randomUUID())
  assert.equal(created.status, 201, 'Create isolated draft through cookie session')
  const id = created.data.doc.id
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
  assert.deepEqual(stored.layout.map(block => block.heading), ['Second draft block', 'Edited first block'])
  console.log(`[production-editor] PASS ${width}px edit, keyboard reorder, save, reload and preview`)
  return stored
}
