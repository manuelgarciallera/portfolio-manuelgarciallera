import assert from 'node:assert/strict'

export const verifyPublicationFlow = async ({ page, request, pageId, releaseId, name, base }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const before = await (await request.get(`${base}/api/pages/${pageId}?draft=true&depth=0`)).json()
  const prepared = await request.post(`${base}/api/owner/publication-bundles`, { data: { confirmation: 'PREPARAR PUBLICACIÓN', name, releaseIds: [releaseId] } })
  assert.equal(prepared.status(), 201, await prepared.text())
  const bundle = (await prepared.json()).bundle
  await page.goto(`${base}/admin/collections/publication-bundles/${bundle.id}`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
  for (const step of [
    { phrase: 'APROBAR PAQUETE', button: 'Registrar decisión', path: /\/publication-bundles\/[^/]+\/review$/, link: 'Ver revisión inmutable' },
    { phrase: 'GENERAR ARTEFACTO', button: 'Generar artefacto', path: /\/publication-reviews\/[^/]+\/artifacts$/, link: 'Ver artefacto inmutable' },
    { phrase: 'VALIDAR ARTEFACTO', button: 'Validar preparación', path: /\/publication-artifacts\/[^/]+\/preflights$/, link: 'Ver informe inmutable' },
  ]) {
    await page.locator('form[data-form-ready="true"]').first().waitFor({ timeout: 30_000 })
    const input = page.getByRole('textbox', { name: `Escribe ${step.phrase}`, exact: true })
    await input.waitFor({ timeout: 30_000 })
    assert.equal(await page.locator('form form').count(), 0)
    await input.fill(step.phrase)
    const response = page.waitForResponse((candidate) => candidate.request().method() === 'POST' && step.path.test(new URL(candidate.url()).pathname))
    if (step.phrase === 'GENERAR ARTEFACTO') await page.getByRole('button', { name: step.button, exact: true }).click()
    else await input.press('Enter')
    const result = await response.catch(async (error) => {
      throw new Error(`${error.message}\nUI diagnostic: ${JSON.stringify({ url: page.url(), phrase: await input.inputValue(), status: await page.getByRole('status').allTextContents(), errors })}`)
    })
    assert.equal(result.status(), 201, await result.text())
    await page.getByRole('link', { name: step.link, exact: true }).click()
  }
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  assert.deepEqual(await (await request.get(`${base}/api/pages/${pageId}?draft=true&depth=0`)).json(), before, 'Preparing publication evidence must not edit or publish the page')
  assert.deepEqual(errors, [])
  console.log('PASS: real Payload publication review, artifact generation and preflight create evidence without changing the page or producing runtime errors.')
}
