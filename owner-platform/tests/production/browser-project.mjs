import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

// Extends the existing modular-editor acceptance into the isolated production
// harness. API fixture creation is intentional; editing and saving are native.
export const verifyBrowserProject = async ({ page, origin, width, mediaPage }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  const title = `Proyecto modular QA ${randomUUID()}`
  const quote = 'Contenido modular sin duplicación en el cuerpo clásico.'
  // Use the already authenticated browser with the fixture's pinned key.
  // A separate APIRequestContext does not inherit Chromium's certificate pin.
  const created = await page.evaluate(async data => {
    const response = await fetch('/api/projects?draft=true', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data), signal: AbortSignal.timeout(10_000),
    })
    return { status: response.status, body: await response.json() }
  }, {
    title, slug: `project-qa-${randomUUID()}`, summary: 'Proyecto sintético de verificación.',
    heroImage: mediaPage.layout[0].asset,
    caseStudyLayout: [{ blockType: 'caseQuote', quote }],
  })
  assert.equal(created.status, 201, 'Prepare a block-only project fixture')
  const { doc } = created.body
  await page.goto(`${origin}/admin/collections/projects/${doc.id}`, { waitUntil: 'domcontentloaded' })
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
  console.log(`[project-editor] PASS ${width}px block-only fixture edited and saved through native form`)
}
