import assert from 'node:assert/strict'
import { verifyBrowserPageTrash } from './browser-page-trash.mjs'

export const verifyBrowserMediaPage = async ({ page, origin, width, media, placement }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  await page.goto(`${origin}/admin/collections/pages/create`, { waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  const title = `Encuadre en página ${width}`
  const caption = `Original conservado · ${width}`
  await page.getByRole('textbox', { name: /^Título de la página/ }).fill(title)
  await page.getByRole('textbox', { name: /^Identificador de URL/ }).fill(`native-media-${width}-${placement.id}`)
  await page.locator('.blocks-field__drawer-toggler').press('Enter')
  await page.getByRole('button', { name: 'Imagen', exact: true }).click()
  const asset = page.locator('#field-layout__0__asset')
  await asset.locator('.upload__listToggler').click()
  await page.locator('.list-drawer').getByRole('row').filter({ hasText: media.alt })
    .getByRole('button', { name: media.filename }).press('Enter')
  await page.locator('.list-drawer').waitFor({ state: 'hidden' })
  await asset.getByRole('img', { name: media.alt, exact: true }).waitFor()
  const crop = page.getByRole('combobox', { name: 'Encuadre', exact: true })
  await crop.waitFor()
  await page.locator('#field-layout__0__placement label').click()
  assert.equal(await crop.evaluate(element => document.activeElement === element), true, 'Placement label focuses its native input')
  await crop.fill(placement.name)
  await page.getByRole('option', { name: placement.name, exact: true }).click()
  await page.getByRole('textbox', { name: /^Pie de imagen/ }).fill(caption)
  const saving = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/pages')
    .then(response => ({ response }), error => ({ error }))
  await page.locator('#action-save-draft').press('Enter')
  const result = await saving
  if ('error' in result) throw result.error
  assert.equal(result.response.status(), 201, 'Create page with native media and placement selection')
  const { doc } = await result.response.json()
  await page.waitForURL(url => url.pathname === `/admin/collections/pages/${doc.id}`)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  await crop.waitFor()
  await page.locator('#field-layout__0__placement label').click()
  assert.equal(await crop.evaluate(element => document.activeElement === element), true, 'Placement label remains associated after reload')
  assert.equal(await page.getByRole('textbox', { name: /^Pie de imagen/ }).inputValue(), caption)
  const stored = await page.evaluate(async id => {
    const response = await fetch(`/api/pages/${id}?draft=true&depth=0`, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error('Cannot read native media page')
    return response.json()
  }, doc.id)
  assert.equal(stored.title, title)
  assert.equal(stored._status, 'draft')
  assert.equal(stored.layout.length, 1)
  assert.equal(stored.layout[0].blockType, 'media')
  assert.equal(stored.layout[0].asset, media.id)
  assert.equal(stored.layout[0].placement, placement.id)
  const popup = page.context().waitForEvent('page').then(preview => ({ preview }), error => ({ error }))
  await page.getByRole('link', { name: /Ver borrador guardado/ }).press('Enter')
  const opened = await popup
  if ('error' in opened) throw opened.error
  const preview = opened.preview
  try {
    await preview.waitForURL(`${origin}/admin/content-preview/pages/${doc.id}`)
    await preview.getByRole('button', { name: 'Móvil', exact: true }).click()
    const image = preview.locator('article [data-block-type="media"]').getByRole('img', { name: media.alt, exact: true })
    await image.scrollIntoViewIfNeeded()
    await image.evaluate(element => element.decode())
    assert.equal(await image.evaluate(element => getComputedStyle(element).objectPosition), '100% 0%')
    assert.equal(await image.evaluate(element => getComputedStyle(element).transform), 'matrix(4, 0, 0, 4, 0, 0)')
    await preview.getByText(caption, { exact: true }).waitFor()
    assert.equal(await preview.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  } finally { await preview.close() }
  console.log(`[media-page] PASS ${width}px native media block, saved relationships and mobile crop preview`)
  return verifyBrowserPageTrash({ page, origin, before: stored })
}
