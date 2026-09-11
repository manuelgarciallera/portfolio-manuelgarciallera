import assert from 'node:assert/strict'

export const verifyLocalEditorRecovery = async (sourcePage) => {
  const page = await sourcePage.context().newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  const loader = '**/vendor/monaco/**/loader.js'
  try {
    // A real unavailable asset must show recovery, not an endless spinner.
    await page.route(loader, route => route.abort('failed'))
    await page.goto(sourcePage.url(), { waitUntil: 'domcontentloaded' })
    await page.getByRole('alert').filter({ hasText: 'No se ha podido cargar el editor de datos.' }).waitFor()
    assert.equal(await page.locator('.monaco-editor').count(), 0)
    await page.unroute(loader)
    await page.getByRole('button', { name: 'Recargar para reintentar', exact: true }).click()
    await page.locator('.monaco-editor .view-lines').first().waitFor({ state: 'visible', timeout: 30_000 })
    assert.deepEqual(errors, [])
  } finally {
    await page.close()
  }
}
