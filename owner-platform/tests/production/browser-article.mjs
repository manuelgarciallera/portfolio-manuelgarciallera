import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

export const verifyBrowserArticle = async ({ page, context, origin, width }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  const title = `Artículo de prueba ${width}`
  const slug = `articulo-qa-${randomUUID()}`
  const excerpt = 'Resumen editorial sintético, sin datos personales ni publicación.'
  const initialBody = 'Un sistema de diseño necesita decisiones explícitas y pruebas de sus componentes.'
  const body = `${initialBody} Esta revisión se ha editado después del primer guardado.`
  await page.goto(`${origin}/admin/collections/articles/create`, { waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  await page.locator('#field-title').fill(title)
  await page.locator('#field-slug').fill(slug)
  await page.locator('#field-excerpt').fill(excerpt)
  const content = page.locator('[data-field-path="content"] [contenteditable="true"]')
  await content.fill(initialBody)
  const saving = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/articles')
    .then(response => ({ response }), error => ({ error }))
  await page.locator('#action-save-draft').press('Enter')
  const result = await saving
  if ('error' in result) throw result.error
  const creation = await result.response.json()
  assert.equal(result.response.status(), 201, JSON.stringify(creation.errors ?? []))
  const { doc } = creation
  assert.equal(doc._status, 'draft')
  await page.waitForURL(url => url.pathname === `/admin/collections/articles/${doc.id}`)
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  await content.fill(body)
  // Lexical updates Payload's modified state asynchronously. Pressing Enter
  // on a still-disabled button leaves focus in the editor instead of saving.
  await page.waitForFunction(() => document.querySelector('#action-save-draft')?.disabled === false)
  const updating = page.waitForResponse(response => response.request().method() === 'PATCH' && new URL(response.url()).pathname === `/api/articles/${doc.id}`)
    .then(response => ({ response }), error => ({ error }))
  await page.locator('#action-save-draft').press('Enter')
  const updated = await updating
  if ('error' in updated) throw updated.error
  assert.equal(updated.response.status(), 200)
  await page.waitForFunction(() => document.querySelector('#action-save-draft')?.disabled === true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  assert.equal(await page.locator('#field-title').inputValue(), title)
  assert.equal(await page.locator('#field-slug').inputValue(), slug)
  assert.equal(await page.locator('#field-excerpt').inputValue(), excerpt)
  assert.equal(await content.innerText(), body)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  const popup = context.waitForEvent('page').then(preview => ({ preview }), error => ({ error }))
  await page.getByRole('link', { name: /Ver borrador guardado/ }).press('Enter')
  const opened = await popup
  if ('error' in opened) throw opened.error
  try {
    await opened.preview.waitForURL(`${origin}/admin/content-preview/articles/${doc.id}`)
    await opened.preview.getByRole('heading', { name: title, exact: true }).waitFor()
    await opened.preview.getByText(excerpt, { exact: true }).waitFor()
    await opened.preview.getByText(body, { exact: true }).waitFor()
    assert.equal(await opened.preview.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  } finally { await opened.preview.close() }
  console.log(`[article-editor] PASS ${width}px native draft creation, edit, reload and preview`)
}
