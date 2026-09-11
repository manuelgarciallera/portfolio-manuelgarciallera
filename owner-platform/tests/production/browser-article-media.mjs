import assert from 'node:assert/strict'

// Catches lost article media relationships, unlabelled placement selection,
// incorrect preview crop and mutation of the preserved classic body.
export const verifyArticleMedia = async ({ page, origin, width, articleId, body, mediaPage }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  const source = mediaPage.layout[0]
  const { media, placement } = await page.evaluate(async ({ asset, placement }) => {
    const read = async path => {
      const response = await fetch(path, { signal: AbortSignal.timeout(10_000) })
      if (!response.ok) throw new Error('Cannot read existing native media fixture')
      return response.json()
    }
    return { media: await read(`/api/media/${asset}?depth=0`), placement: await read(`/api/media-placements/${placement}?depth=0`) }
  }, source)
  await page.locator('.blocks-field__drawer-toggler').press('Enter')
  await page.getByRole('button', { name: 'Imagen', exact: true }).click()
  const assetField = page.locator('#field-articleLayout__0__asset')
  await assetField.locator('.upload__listToggler').click()
  await page.locator('.list-drawer').getByRole('row').filter({ hasText: media.alt })
    .getByRole('button', { name: media.filename }).press('Enter')
  await page.locator('.list-drawer').waitFor({ state: 'hidden' })
  await assetField.getByRole('img', { name: media.alt, exact: true }).waitFor()
  const crop = page.getByRole('combobox', { name: 'Encuadre', exact: true })
  await crop.waitFor()
  await page.locator('#field-articleLayout__0__placement label').click()
  assert.equal(await crop.evaluate(element => document.activeElement === element), true)
  await crop.fill(placement.name)
  await page.getByRole('option', { name: placement.name, exact: true }).click()
  const alt = `Imagen contextual del artículo ${width}`
  const caption = `Encuadre editorial conservado ${width}`
  await page.getByRole('textbox', { name: /^Texto alternativo/ }).fill(alt)
  await page.getByRole('textbox', { name: /^Pie de imagen/ }).fill(caption)
  await page.waitForFunction(() => document.querySelector('#action-save-draft')?.disabled === false)
  const saving = page.waitForResponse(response => response.request().method() === 'PATCH' && new URL(response.url()).pathname === `/api/articles/${articleId}`)
    .then(response => ({ response }), error => ({ error }))
  await page.locator('#action-save-draft').press('Enter')
  const result = await saving
  if ('error' in result) throw result.error
  assert.equal(result.response.status(), 200)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  await crop.waitFor()
  assert.equal(await page.getByRole('textbox', { name: /^Texto alternativo/ }).inputValue(), alt)
  assert.equal(await page.locator('[data-field-path="content"] [contenteditable="true"]').innerText(), body)
  const stored = await page.evaluate(async id => {
    const response = await fetch(`/api/articles/${id}?draft=true&depth=0`, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error('Cannot read saved article')
    return response.json()
  }, articleId)
  assert.equal(stored._status, 'draft')
  assert.equal(stored.articleLayout.length, 1)
  assert.equal(stored.articleLayout[0].blockType, 'articleMedia')
  assert.equal(stored.articleLayout[0].asset, media.id)
  assert.equal(stored.articleLayout[0].placement, placement.id)
  assert.equal(stored.articleLayout[0].alt, alt)
  const opening = page.context().waitForEvent('page').then(preview => ({ preview }), error => ({ error }))
  await page.getByRole('link', { name: /Ver borrador guardado/ }).press('Enter')
  const opened = await opening
  if ('error' in opened) throw opened.error
  try {
    const preview = opened.preview
    await preview.waitForURL(`${origin}/admin/content-preview/articles/${articleId}`)
    await preview.getByRole('button', { name: 'Móvil', exact: true }).click()
    const image = preview.locator('article [data-block-type="media"]').getByRole('img', { name: alt, exact: true })
    await image.scrollIntoViewIfNeeded()
    await image.evaluate(element => element.decode())
    assert.equal(await image.evaluate(element => getComputedStyle(element).objectPosition), '100% 0%')
    assert.equal(await image.evaluate(element => getComputedStyle(element).transform), 'matrix(4, 0, 0, 4, 0, 0)')
    await preview.getByText(caption, { exact: true }).waitFor()
    assert.equal(await preview.getByText(body, { exact: true }).count(), 0)
    assert.equal(await preview.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  } finally { await opened.preview.close() }
  console.log(`[article-media] PASS ${width}px native image, accessible placement, saved relationships and crop preview`)
}
