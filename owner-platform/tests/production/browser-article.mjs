import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { verifyArticleMedia } from './browser-article-media.mjs'

export const verifyBrowserArticle = async ({ page, context, origin, width, mediaPage }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  const title = `Artículo de prueba ${width}`
  const slug = `articulo-qa-${randomUUID()}`
  const excerpt = 'Resumen editorial sintético, sin datos personales ni publicación.'
  const initialBody = 'Un sistema de diseño necesita decisiones explícitas y pruebas de sus componentes.'
  const body = `${initialBody} Esta revisión se ha editado después del primer guardado.`
  await page.goto(`${origin}/admin/collections/articles/create`, { waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  await page.getByRole('textbox', { name: /^Título del artículo/ }).fill(title)
  await page.locator('#field-slug').fill(slug)
  const excerptField = page.getByRole('textbox', { name: /^Resumen/ })
  const content = page.locator('[data-field-path="content"] [contenteditable="true"]')
  await content.fill(initialBody)
  await page.locator('#action-save-draft').press('Enter')
  const excerptError = page.locator('.field-type.textarea').filter({ has: excerptField }).locator('.field-error')
  await excerptError.waitFor({ state: 'visible' })
  await excerptField.scrollIntoViewIfNeeded()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await page.screenshot({ path: `/tmp/owner-form-error-${width}.png` })
  assert((await excerptError.innerText()).trim().length > 0, 'The missing summary has a visible explanation')
  assert.equal(await excerptField.getAttribute('aria-invalid'), 'true', 'The summary error is exposed to assistive technology')
  const describedError = await excerptField.evaluate(element => (element.getAttribute('aria-describedby') ?? '').split(/\s+/)
    .map(id => document.getElementById(id)?.textContent ?? '').join(' '))
  assert(describedError.includes((await excerptError.innerText()).trim()), 'The summary is associated with its actual error message')
  assert.equal(await page.locator('#field-title').inputValue(), title)
  assert.equal(await content.innerText(), initialBody, 'A validation failure must preserve authored content')
  assert.equal(new URL(page.url()).pathname, '/admin/collections/articles/create')
  const errorReference = await excerptError.getAttribute('id')
  // Simulate a second accessible description supplied by an upstream field.
  // Correcting native validation must remove only our error reference.
  await excerptField.evaluate(element => {
    const help = document.createElement('span')
    help.id = 'qa-summary-help'
    help.hidden = true
    help.textContent = 'Descripción adicional de prueba'
    document.body.append(help)
    element.setAttribute('aria-describedby', `${element.getAttribute('aria-describedby')} ${help.id}`)
  })
  await excerptField.fill(excerpt)
  await excerptError.waitFor({ state: 'hidden' })
  assert.notEqual(await excerptField.getAttribute('aria-invalid'), 'true', 'Correcting the summary clears invalid state without navigation')
  const remainingDescriptions = (await excerptField.getAttribute('aria-describedby') ?? '').split(/\s+/)
  assert(!remainingDescriptions.includes(errorReference), 'Removed error must not leave a dangling description')
  assert(remainingDescriptions.includes('qa-summary-help'), 'Cleanup preserves upstream descriptions')
  await excerptField.evaluate(element => {
    element.removeAttribute('aria-describedby')
    document.getElementById('qa-summary-help')?.remove()
  })
  await page.waitForFunction(() => document.querySelector('#action-save-draft')?.disabled === false)
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
  assert.notEqual(await excerptField.getAttribute('aria-invalid'), 'true', 'Corrected and saved summary no longer exposes an error')
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
  const quote = 'La claridad del sistema permite cambiar sin perder lo que ya funciona.'
  for (const modular of [true, false]) {
    if (modular) {
      await page.locator('.blocks-field__drawer-toggler').press('Enter')
      await page.getByRole('button', { name: 'Cita', exact: true }).click()
      await page.getByRole('textbox', { name: /^Texto de la cita/ }).fill(quote)
      await page.getByRole('textbox', { name: /^Autoría o fuente/ }).fill('Autor sintético')
    } else {
      await page.locator('.blocks-field .array-actions__button').press('Enter')
      // Popup keeps inactive buttons mounted and asynchronously focuses its
      // first action after keyboard opening. Wait for that native focus, then
      // navigate as a keyboard user instead of pressing a possibly hidden node.
      await page.waitForFunction(() => {
        const popup = document.querySelector('.popup__content:has(.array-actions__remove)')
        return popup && popup.querySelector('button') === document.activeElement
      })
      await page.keyboard.press('ArrowUp')
      assert.equal(await page.locator('.popup__content .array-actions__remove')
        .evaluate(element => element === document.activeElement), true, 'Native menu wraps focus to Remove')
      await page.keyboard.press('Enter')
      await page.getByRole('textbox', { name: /^Texto de la cita/ }).waitFor({ state: 'hidden' })
    }
    try {
      await page.waitForFunction(() => document.querySelector('#action-save-draft')?.disabled === false)
    } catch (error) {
      console.log('[article-block-diagnostic]', JSON.stringify({ modular,
        quoteFields: await page.getByRole('textbox', { name: /^Texto de la cita/ }).evaluateAll(elements => elements.map(element => element.value)),
        buttons: await page.locator('.array-actions__remove').count(),
        errors: await page.locator('.field-error').allTextContents(),
      }))
      throw error
    }
    const savingLayout = page.waitForResponse(response => response.request().method() === 'PATCH' && new URL(response.url()).pathname === `/api/articles/${doc.id}`)
      .then(response => ({ response }), error => ({ error }))
    await page.locator('#action-save-draft').press('Enter')
    const savedLayout = await savingLayout
    if ('error' in savedLayout) throw savedLayout.error
    assert.equal(savedLayout.response.status(), 200)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('form[data-form-ready="true"]').first().waitFor()
    assert.equal(await content.innerText(), body, 'Classic body remains intact when switching to or from blocks')
    const nextPopup = context.waitForEvent('page').then(preview => ({ preview }), error => ({ error }))
    await page.getByRole('link', { name: /Ver borrador guardado/ }).press('Enter')
    const next = await nextPopup
    if ('error' in next) throw next.error
    try {
      await next.preview.waitForURL(`${origin}/admin/content-preview/articles/${doc.id}`)
      await next.preview.getByRole('heading', { name: title, exact: true }).waitFor()
      await next.preview.getByText(modular ? quote : body, { exact: true }).waitFor()
      assert.equal(await next.preview.getByText(modular ? body : quote, { exact: true }).count(), 0,
        'Preview uses modular content when present, and classic content after removing the block')
      assert.equal(await next.preview.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    } finally { await next.preview.close() }
  }
  console.log(`[article-blocks] PASS ${width}px native quote round-trip preserves classic content`)
  await verifyArticleMedia({ page, origin, width, articleId: doc.id, body, mediaPage })
  console.log(`[article-editor] PASS ${width}px native draft creation, edit, reload and preview`)
}
