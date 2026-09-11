import assert from 'node:assert/strict'

export const verifyUnsavedPage = async ({ page, origin, width, document }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  const path = `/admin/collections/pages/${document.id}`
  await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  const title = page.getByRole('textbox', { name: /^Título de la página/ })
  const heading = page.getByRole('textbox', { name: /^Encabezado/ }).first()
  const editedTitle = `${document.title} sin guardar`
  await title.fill(editedTitle)
  await heading.fill('Cambio que se descartará expresamente')
  await page.waitForFunction(() => document.querySelector('#action-save-draft')?.disabled === false)
  const listLink = page.locator('.step-nav a[href="/admin/collections/pages"]')
  await listLink.press('Enter')
  const dialog = page.locator('.confirmation-modal').filter({ has: page.getByRole('heading', { name: 'Salir sin guardar', exact: true }) })
  await dialog.waitFor({ state: 'visible' })
  assert.equal(new URL(page.url()).pathname, path)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  await dialog.getByRole('button', { name: 'Permanecer en esta página', exact: true }).press('Enter')
  await dialog.waitFor({ state: 'hidden' })
  assert.equal(await title.inputValue(), editedTitle, 'Cancel navigation preserves unsaved title')
  assert.equal(await heading.inputValue(), 'Cambio que se descartará expresamente')
  await listLink.press('Enter')
  await dialog.waitFor({ state: 'visible' })
  await dialog.getByRole('button', { name: 'Salir de todos modos', exact: true }).press('Enter')
  await page.waitForURL(url => url.pathname === '/admin/collections/pages')
  await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  assert.equal(await title.inputValue(), document.title, 'Discard preserves the previously saved title')
  assert.equal(await heading.inputValue(), document.layout[0].heading, 'Discard preserves the previously saved block')
  const saved = await page.evaluate(async id => {
    const response = await fetch(`/api/pages/${id}?draft=true&depth=0`, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error('Cannot read draft after explicit discard')
    return response.json()
  }, document.id)
  assert.deepEqual(saved, document, 'No server fields change on cancel or discard')
  console.log(`[unsaved-page] PASS ${width}px cancel preserves input; explicit discard preserves saved document`)
}
