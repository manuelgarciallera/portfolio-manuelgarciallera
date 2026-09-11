import assert from 'node:assert/strict'

export const verifyBrowserPageTrash = async ({ page, origin, before }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  assert.match(before.slug, /^native-media-(390|1280)-/)
  assert.equal(new URL(page.url()).pathname, `/admin/collections/pages/${before.id}`)
  await page.locator('.doc-controls__popup').getByRole('button').click()
  await page.locator('#action-delete').click()
  const confirmation = page.locator('.delete-document')
  await confirmation.waitFor({ state: 'visible' })
  assert.equal(await confirmation.locator('#delete-forever').isChecked(), false, 'Never permanently delete the fixture')
  const trashed = page.waitForResponse(response => response.request().method() === 'PATCH' && new URL(response.url()).pathname === `/api/pages/${before.id}`)
    .then(response => ({ response }), error => ({ error }))
  await confirmation.locator('#confirm-action').click()
  const deleted = await trashed
  if ('error' in deleted) throw deleted.error
  assert.equal(deleted.response.status(), 200)
  assert((await deleted.response.json()).doc.deletedAt, 'Native action must soft-delete the page')
  await page.waitForURL(url => url.pathname === '/admin/collections/pages')
  await page.goto(`${origin}/admin/collections/pages/trash/${before.id}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: 'Restaurar', exact: true }).click()
  const restoreDialog = page.locator('.restore-button')
  await restoreDialog.waitFor({ state: 'visible' })
  assert.equal(await restoreDialog.locator('#restore-as-published').isChecked(), false, 'Restore only as a draft')
  const restoring = page.waitForResponse(response => response.request().method() === 'PATCH' && new URL(response.url()).pathname === '/api/pages')
    .then(response => ({ response }), error => ({ error }))
  await restoreDialog.locator('#confirm-action').click()
  const restored = await restoring
  if ('error' in restored) throw restored.error
  assert.equal(restored.response.status(), 200)
  await page.waitForURL(url => url.pathname === `/admin/collections/pages/${before.id}`)
  await page.locator('form[data-form-ready="true"]').first().waitFor()
  const after = await page.evaluate(async id => {
    const response = await fetch(`/api/pages/${id}?draft=true&depth=0`, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error('Cannot read restored draft')
    return response.json()
  }, before.id)
  assert.equal(after.deletedAt ?? null, null)
  assert.equal(after._status, 'draft')
  for (const key of ['id', 'title', 'slug', 'layout']) assert.deepEqual(after[key], before[key], `Restored ${key} remains intact`)
  console.log('[page-trash] PASS native soft deletion and draft restoration preserve content and relationships')
  return after
}
