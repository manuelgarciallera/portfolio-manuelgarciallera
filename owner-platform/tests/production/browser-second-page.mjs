import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

// The brand is synthetic fixture setup; page authorship uses the actual CMS.
// This verifies a second page, not tenancy or a publicly deployed second site.
export const verifySecondPage = async ({ page, context, origin, width, firstPage }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  const suffix = randomUUID()
  const brandName = `Estudio Claro ${suffix}`
  const brand = await page.evaluate(async name => {
    const values = { background: '#FFF9ED', surface: '#FFFFFF', text: '#192C25', mutedText: '#465C50', accent: '#34664B', interaction: '#245236', success: '#235B38', danger: '#A92222' }
    const response = await fetch('/api/brand-profiles?draft=true', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug: name.toLowerCase().replaceAll(' ', '-'),
        colors: Object.entries(values).map(([role, value]) => ({ role, value })),
        usageWeights: [{ role: 'background', weight: 80 }, { role: 'accent', weight: 20 }],
        typography: { primaryFamily: 'serif', secondaryFamily: 'sans-serif' },
        motion: { duration: 300, stagger: 0, travel: 0, easing: 'ease', reducedMotion: 'disable' },
      }), signal: AbortSignal.timeout(10_000),
    })
    if (response.status !== 201) throw new Error(`Synthetic brand setup failed ${response.status}`)
    return (await response.json()).doc
  }, brandName)
  await page.goto(`${origin}/admin/collections/pages/create`, { waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  await page.getByRole('textbox', { name: /^Título de la página/ }).fill('Estudio Claro · Servicios')
  await page.getByRole('textbox', { name: /^Identificador de URL/ }).fill(`estudio-claro-${suffix}`)
  const brandControl = page.getByRole('combobox', { name: 'Perfil de marca', exact: true })
  await brandControl.waitFor({ timeout: 5000 })
  await page.locator('#field-brandProfile label').click()
  assert.equal(await brandControl.evaluate(element => document.activeElement === element), true,
    'The visible brand label must focus its native selector')
  await brandControl.fill(brandName)
  await page.getByRole('option', { name: brandName, exact: true }).click()
  await page.locator('.blocks-field__drawer-toggler').press('Enter')
  await page.getByRole('button', { name: 'Portada', exact: true }).click()
  await page.getByRole('textbox', { name: /^Antetítulo/ }).fill('ESTUDIO INDEPENDIENTE · DEMOSTRACIÓN')
  await page.getByRole('textbox', { name: /^Encabezado/ }).fill('Ideas claras. Espacios para crecer.')
  await page.locator('.blocks-field__drawer-toggler').press('Enter')
  await page.getByRole('button', { name: 'Texto enriquecido', exact: true }).click()
  // The newly added Lexical field mounts asynchronously. Selecting the last
  // currently mounted editor can write into the hero body instead.
  const content = page.locator('[data-field-path="layout.1.content"] [contenteditable="true"]')
  await content.fill('Diseño de identidad, comunicación y experiencias digitales. Contenido ficticio para probar el editor; no es una oferta comercial.')
  await content.press('ControlOrMeta+a')
  await content.press('ControlOrMeta+b')
  await content.press('ControlOrMeta+i')
  // Lexical uses one strong element plus the italic theme class, not nested tags.
  const assertEditorFormatting = async () => {
    const formatted = content.locator('strong')
    await formatted.waitFor()
    const style = await formatted.evaluate(element => ({ weight: getComputedStyle(element).fontWeight, style: getComputedStyle(element).fontStyle }))
    assert(Number(style.weight) >= 600, 'Bold text is visibly heavier in the editor')
    assert.equal(style.style, 'italic', 'Italic text is visible in the editor')
  }
  await assertEditorFormatting()
  const saving = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/pages')
    .then(response => ({ response }), error => ({ error }))
  await page.locator('#action-save-draft').press('Enter')
  const saveResult = await saving
  if ('error' in saveResult) throw saveResult.error
  const response = saveResult.response
  const creation = await response.json()
  const diagnostic = response.status() === 201 ? null : {
    errors: creation.errors ?? [],
    submittedText: response.request().postData()?.includes('Diseño de identidad') ?? false,
    editors: await page.locator('[contenteditable="true"]').evaluateAll(elements => elements.map(element => ({
      path: element.closest('[data-field-path]')?.getAttribute('data-field-path'),
      text: element.textContent,
    }))),
  }
  assert.equal(response.status(), 201, JSON.stringify(diagnostic))
  const { doc } = creation
  assert.notEqual(doc.id, firstPage.id)
  await page.waitForURL(url => url.pathname === `/admin/collections/pages/${doc.id}`)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  await assertEditorFormatting()
  await brandControl.waitFor({ timeout: 5000 })
  await page.locator('#field-brandProfile label').click()
  assert.equal(await brandControl.evaluate(element => document.activeElement === element), true,
    'The saved brand selector must remain labelled after reload')
  const popup = context.waitForEvent('page').then(preview => ({ preview }), error => ({ error }))
  await page.getByRole('link', { name: /Ver borrador guardado/ }).press('Enter')
  const popupResult = await popup
  if ('error' in popupResult) throw popupResult.error
  const preview = popupResult.preview
  try {
    await preview.waitForURL(`${origin}/admin/content-preview/pages/${doc.id}`)
    const heading = preview.getByRole('heading', { name: 'Ideas claras. Espacios para crecer.', exact: true })
    await heading.waitFor()
    assert.equal(await heading.evaluate(element => getComputedStyle(element).fontFamily), 'serif')
    await preview.getByText(/Diseño de identidad, comunicación y experiencias digitales/).waitFor()
    const formatted = preview.locator('article [data-block-type="richText"] strong em, article [data-block-type="richText"] em strong')
    await formatted.waitFor()
    assert.match(await formatted.textContent(), /Diseño de identidad/)
    assert.equal(await preview.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.equal(await preview.locator('article').evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(255, 249, 237)')
    if (process.env.OWNER_SECOND_PAGE_SCREENSHOTS === '1') await preview.screenshot({ path: `/tmp/owner-second-page-${width}.png`, fullPage: true })
  } finally { await preview.close() }
  const reread = await page.evaluate(async ({ firstId, secondId }) => {
    const read = async id => {
      const result = await fetch(`/api/pages/${id}?draft=true&depth=0`, { signal: AbortSignal.timeout(10_000) })
      if (!result.ok) throw new Error('Page reread failed')
      return result.json()
    }
    return { first: await read(firstId), second: await read(secondId) }
  }, { firstId: firstPage.id, secondId: doc.id })
  assert.deepEqual(reread.first, firstPage, 'Creating another page must not change the first document')
  assert.equal(reread.second.brandProfile, brand.id)
  assert.deepEqual(reread.second.layout.map(block => block.blockType), ['hero', 'richText'])
  console.log(`[second-page] PASS ${width}px native page creation, distinct brand preview and first document unchanged`)
  return reread.second
}
