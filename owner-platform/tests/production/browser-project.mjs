import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

// Extends the existing modular-editor acceptance into the isolated production
// harness. Creation, media selection, editing and saving use the native UI.
export const verifyBrowserProject = async ({ page, context, origin, width, mediaPage }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  const title = `Proyecto modular QA ${randomUUID()}`
  const quote = 'Contenido modular sin duplicación en el cuerpo clásico.'
  const summary = 'Proyecto sintético de verificación.'
  const media = await page.evaluate(async id => {
    const response = await fetch(`/api/media/${id}?depth=0`, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error('Cannot read native media fixture')
    return response.json()
  }, mediaPage.layout[0].asset)
  await page.goto(`${origin}/admin/collections/projects/create`, { waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  await page.locator('#field-title').fill(title)
  await page.locator('#field-slug').fill(`project-qa-${randomUUID()}`)
  await page.locator('#field-summary').fill(summary)
  await page.locator('#field-heroImage .upload__listToggler').click()
  await page.locator('.list-drawer').getByRole('row').filter({ hasText: media.alt })
    .getByRole('button', { name: media.filename }).press('Enter')
  await page.locator('.list-drawer').waitFor({ state: 'hidden' })
  await page.locator('#field-heroImage').getByRole('img', { name: media.alt, exact: true }).waitFor()
  await page.locator('.blocks-field__drawer-toggler').press('Enter')
  await page.getByRole('button', { name: 'Case Quote', exact: true }).click()
  await page.locator('#field-caseStudyLayout__0__quote').fill(quote)
  const creating = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/projects')
    .then(response => ({ response }), error => ({ error }))
  await page.locator('#action-save-draft').press('Enter')
  const created = await creating
  if ('error' in created) throw created.error
  assert.equal(created.response.status(), 201, 'Create a block-only project through the native form')
  const { doc } = await created.response.json()
  await page.waitForURL(url => url.pathname === `/admin/collections/projects/${doc.id}`)
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  const save = page.locator('#action-save-draft')
  assert.equal(await save.isDisabled(), true)
  const editedTitle = `${title} editado`
  await page.locator('#field-title').fill(editedTitle)
  await page.waitForFunction(() => document.querySelector('#action-save-draft')?.disabled === false)
  const saving = page.waitForResponse(response => response.request().method() === 'PATCH' && new URL(response.url()).pathname === `/api/projects/${doc.id}`)
    .then(response => ({ response }), error => ({ error }))
  await save.press('Enter')
  const result = await saving
  if ('error' in result) throw result.error
  assert.equal(result.response.status(), 200, 'Saving modular projects must not require an unused classic body')
  await page.waitForFunction(() => document.querySelector('#action-save-draft')?.disabled === true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  assert.equal(await page.locator('#field-title').inputValue(), editedTitle)
  const stored = await page.evaluate(async id => {
    const response = await fetch(`/api/projects/${id}?draft=true&depth=0`, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error('Cannot reread browser-edited project')
    return response.json()
  }, doc.id)
  assert.equal(stored.title, editedTitle)
  assert.equal(stored._status, 'draft')
  assert.equal(stored.caseStudyLayout.length, 1)
  assert.equal(stored.caseStudyLayout[0].quote, quote)
  assert.equal(JSON.stringify(stored.body ?? null).includes(quote), false)
  assert.equal(stored.heroImage, mediaPage.layout[0].asset)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  const opening = context.waitForEvent('page').then(preview => ({ preview }), error => ({ error }))
  await page.getByRole('link', { name: /Ver borrador guardado/ }).press('Enter')
  const opened = await opening
  if ('error' in opened) throw opened.error
  try {
    await opened.preview.waitForURL(`${origin}/admin/content-preview/projects/${doc.id}`)
    await opened.preview.getByRole('heading', { name: editedTitle, exact: true }).waitFor()
    await opened.preview.getByText(summary, { exact: true }).waitFor()
    await opened.preview.getByText(quote, { exact: true }).waitFor()
    const image = opened.preview.locator('article').getByRole('img', { name: media.alt, exact: true })
    await image.scrollIntoViewIfNeeded()
    await image.evaluate(element => element.decode())
    assert.equal(await image.evaluate(element => element.naturalWidth > 0 && element.naturalHeight > 0), true,
      'The selected project cover must render in the saved preview')
    assert.equal(await opened.preview.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  } finally { await opened.preview.close() }
  console.log(`[project-editor] PASS ${width}px native block-only creation, media selection, edit and preview`)
  return stored
}
