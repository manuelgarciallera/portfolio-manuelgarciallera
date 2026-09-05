import assert from 'node:assert/strict'

export const verifyRestoreFlow = async ({ page, request, overview, pageId, name, originalTitle, base }) => {
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  const publishedTitle = `Published ${name}`
  const published = await request.patch(`${base}/api/pages/${pageId}`, { data: {
    _status: 'published', title: publishedTitle, layout: [{ blockType: 'hero', heading: 'Published QA content must remain' }],
  } })
  assert.equal(published.status(), 200)
  const readPage = async (draft) => {
    const response = await request.get(`${base}/api/pages/${pageId}?draft=${draft}&depth=0`)
    assert.equal(response.status(), 200)
    return response.json()
  }
  const beforeConfirmation = { draft: await readPage(true), published: await readPage(false) }
  const assertControlsFit = async (group) => {
    for (const target of [group, group.getByRole('textbox'), group.getByRole('button')]) {
      const bounds = await target.boundingBox()
      assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= page.viewportSize().width, 'Restore controls and children must fit the viewport')
    }
  }
  const version = overview.locator('li').filter({ has: page.getByRole('link').filter({ hasText: name }) })
  await version.locator('summary', { hasText: 'Restaurar esta versión' }).click()
  await version.getByRole('textbox', { name: `Confirmación para restaurar ${name}` }).fill('PREPARAR RESTAURACIÓN')
  const preparing = page.waitForResponse((response) => response.request().method() === 'POST' && /\/releases\/[^/]+\/restore-plans$/.test(new URL(response.url()).pathname))
  await version.getByRole('button', { name: 'Preparar plan', exact: true }).click()
  assert.equal((await preparing).status(), 201)
  await version.getByRole('link', { name: 'Revisar plan preparado' }).click()
  await page.getByRole('button', { name: 'Comprobar y confirmar', exact: true }).waitFor({ timeout: 30_000 })
  const controls = page.getByRole('group', { name: 'Confirmar restauración', exact: true })
  await assertControlsFit(controls)
  assert.equal(await page.locator('form form').count(), 0, 'Document controls must not nest forms inside the CMS form')
  await page.getByRole('textbox', { name: 'Escribe CONFIRMAR RESTAURACIÓN', exact: true }).fill('CONFIRMAR RESTAURACIÓN')
  const confirming = page.waitForResponse((response) => response.request().method() === 'PATCH' && /\/restore-plans\/[^/]+\/confirm$/.test(new URL(response.url()).pathname))
  await page.getByRole('textbox', { name: 'Escribe CONFIRMAR RESTAURACIÓN', exact: true }).press('Enter')
  assert.equal((await confirming).status(), 200)
  assert.equal(new URL(page.url()).searchParams.has('confirmation'), false, 'Enter must not submit the parent document form')
  const executionInput = page.getByRole('textbox', { name: 'Escribe EJECUTAR RESTAURACIÓN', exact: true })
  await executionInput.waitFor()
  assert.equal(await executionInput.inputValue(), '', 'Confirmation must clear the phrase before execution')
  assert.deepEqual({ draft: await readPage(true), published: await readPage(false) }, beforeConfirmation, 'Confirmation alone must leave page content and metadata unchanged')
  await assertControlsFit(page.getByRole('group', { name: 'Ejecutar restauración', exact: true }))
  await executionInput.fill('EJECUTAR RESTAURACIÓN')
  const executing = page.waitForResponse((response) => response.request().method() === 'POST' && /\/restore-plans\/[^/]+\/execute$/.test(new URL(response.url()).pathname))
  await page.getByRole('button', { name: 'Restaurar como borrador', exact: true }).click()
  assert.equal((await executing).status(), 200)
  await page.getByText('Restauración ejecutada', { exact: true }).waitFor()
  const draftResponse = await request.get(`${base}/api/pages/${pageId}?draft=true&depth=0`)
  const publicResponse = await request.get(`${base}/api/pages/${pageId}?draft=false&depth=0`)
  assert.equal(draftResponse.status(), 200)
  assert.equal(publicResponse.status(), 200)
  const draft = await draftResponse.json()
  const live = await publicResponse.json()
  assert.equal(draft.title, originalTitle)
  assert.equal(draft.layout[0].heading, 'QA only')
  assert.equal(draft._status, 'draft')
  assert.equal(live.title, publishedTitle)
  assert.equal(live.layout[0].heading, 'Published QA content must remain')
  assert.equal(live._status, 'published')
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.getByText('Restauración ejecutada', { exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Restaurar como borrador', exact: true }).count(), 0)
  assert.deepEqual(pageErrors, [], 'Restore navigation must not produce hydration or runtime errors')
  console.log(`PASS: real restore via keyboard and button at ${page.viewportSize().width}px preserves published content, fits the viewport and persists on reload without runtime errors.`)
}
