import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

export const verifyBrowserProjectGrid = async ({ page, context, origin, width, project }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  const title = `Selección de proyectos QA ${width}`
  await page.goto(`${origin}/admin/collections/pages/create`, { waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  await page.getByRole('textbox', { name: /^Título de la página/ }).fill(title)
  await page.getByRole('textbox', { name: /^Identificador de URL/ }).fill(`project-grid-qa-${randomUUID()}`)
  await page.locator('.blocks-field__drawer-toggler').press('Enter')
  await page.getByRole('button', { name: 'Galería de proyectos', exact: true }).click()
  await page.getByRole('textbox', { name: /^Encabezado/ }).fill('Proyectos seleccionados')
  const selection = page.getByRole('combobox', { name: 'Proyectos', exact: true })
  await selection.waitFor({ timeout: 5000 })
  await page.locator('#field-layout__0__projects label.field-label').click()
  assert.equal(await selection.evaluate(element => document.activeElement === element), true,
    'The project-grid label must focus its actual multi-select input')
  await selection.fill(project.title)
  await page.getByRole('option', { name: project.title, exact: true }).click()
  await page.locator('.blocks-field__drawer-toggler').press('Enter')
  await page.getByRole('button', { name: 'Sección especial', exact: true }).click()
  const feature = page.locator('#field-layout__1__featureKey').getByRole('combobox')
  await feature.click()
  await page.getByRole('option', { name: 'Panel de contacto', exact: true }).click()
  const saving = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/pages')
    .then(response => ({ response }), error => ({ error }))
  await page.locator('#action-save-draft').press('Enter')
  const result = await saving
  if ('error' in result) throw result.error
  assert.equal(result.response.status(), 201, 'Create mixed page blocks through the native form')
  const { doc } = await result.response.json()
  await page.waitForURL(url => url.pathname === `/admin/collections/pages/${doc.id}`)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  await page.locator('#field-layout__0__projects').getByText(project.title, { exact: true }).waitFor()
  await selection.waitFor({ timeout: 5000 })
  await page.locator('#field-layout__0__projects label.field-label').click()
  assert.equal(await selection.evaluate(element => document.activeElement === element), true,
    'The project-grid selector must remain labelled after save and reload')
  await page.locator('#field-layout__1__featureKey').getByText('Panel de contacto', { exact: true }).waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  const read = id => page.evaluate(async ({ collection, id }) => {
    const response = await fetch(`/api/${collection}/${id}?draft=true&depth=0`, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error('Cannot reread native grid fixture')
    return response.json()
  }, id)
  const stored = await read({ collection: 'pages', id: doc.id })
  assert.equal(stored._status, 'draft')
  assert.deepEqual(stored.layout.map(block => block.blockType), ['projectGrid', 'customFeature'])
  assert.deepEqual(stored.layout[0].projects, [project.id])
  assert.equal(stored.layout[1].featureKey, 'contact-panel')
  assert.deepEqual(await read({ collection: 'projects', id: project.id }), project, 'Selecting a project must not edit it')
  const opening = context.waitForEvent('page').then(preview => ({ preview }), error => ({ error }))
  await page.getByRole('link', { name: /Ver borrador guardado/ }).press('Enter')
  const opened = await opening
  if ('error' in opened) throw opened.error
  try {
    const preview = opened.preview
    await preview.waitForURL(`${origin}/admin/content-preview/pages/${doc.id}`)
    await preview.getByRole('heading', { name: project.title, exact: true }).waitFor()
    await preview.getByText(project.summary, { exact: true }).waitFor()
    assert.equal(await preview.getByRole('link', { name: 'Editar proyecto', exact: true }).getAttribute('href'), `/admin/collections/projects/${project.id}`)
    const image = preview.locator('[data-block-type="projectGrid"] img')
    await image.scrollIntoViewIfNeeded()
    await image.evaluate(element => element.decode())
    assert.equal(await image.evaluate(element => element.naturalWidth > 0), true)
    await preview.locator('[data-block-type="customFeature"]').getByText(/no están conectadas a esta vista editorial/).waitFor()
    assert.equal(await preview.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
  } finally { await opened.preview.close() }
  console.log(`[project-grid] PASS ${width}px native mixed blocks, retained project, decoded cover and explicit special-module limitation`)
  return stored
}
