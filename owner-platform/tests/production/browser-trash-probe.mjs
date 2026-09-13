import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

// Diagnostic, not a substitute for the full native create/delete/restore journey.
// All writes target one fresh synthetic draft in the runner's ephemeral database.
export const verifyBrowserTrashProbe = async ({ page, origin, width }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  const slug = `trash-probe-${width}-${randomUUID()}`
  const before = await page.evaluate(async slug => {
    const response = await fetch('/api/pages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: slug, slug, _status: 'draft', layout: [{ blockType: 'hero', heading: 'Trash probe content' }] }),
      signal: AbortSignal.timeout(10_000),
    })
    if (response.status !== 201) throw new Error(`Synthetic trash draft creation failed: ${response.status} ${JSON.stringify((await response.json()).errors)}`)
    const { doc } = await response.json()
    const trash = await fetch(`/api/pages/${doc.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deletedAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!trash.ok || !(await trash.json()).doc.deletedAt) throw new Error('Synthetic soft deletion failed')
    return doc
  }, slug)
  for (let attempt = 0; attempt < 12; attempt++) {
    await page.goto(`${origin}/admin/collections/pages/trash/${before.id}`, { waitUntil: 'domcontentloaded' })
    const trigger = page.getByRole('button', { name: 'Restaurar', exact: true })
    await trigger.waitFor()
    const readyBeforeClick = await page.locator('form[data-form-ready="true"]').count()
    await trigger.click()
    const dialog = page.locator('.restore-button')
    try {
      await dialog.waitFor({ state: 'visible' })
    } catch (error) {
      console.log('[trash-probe failure]', JSON.stringify({ width, attempt, readyBeforeClick,
        readyAfterClick: await page.locator('form[data-form-ready="true"]').count(),
        path: new URL(page.url()).pathname,
        buttons: await page.getByRole('button').allTextContents(),
        dialogs: await page.locator('[role="dialog"]').count(),
      }))
      throw error
    }
    assert.equal(await dialog.locator('#restore-as-published').isChecked(), false)
    console.log('[trash-probe first-click]', JSON.stringify({ width, attempt, readyBeforeClick, opened: true }))
    if (attempt < 11) {
      await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click()
      await dialog.waitFor({ state: 'hidden' })
    } else {
      const restoring = page.waitForResponse(response => response.request().method() === 'PATCH' && new URL(response.url()).pathname === '/api/pages')
        .then(response => ({ response }), error => ({ error }))
      await dialog.locator('#confirm-action').click()
      const restored = await restoring
      if ('error' in restored) throw restored.error
      assert.equal(restored.response.status(), 200)
      await page.waitForURL(url => url.pathname === `/admin/collections/pages/${before.id}`)
    }
  }
  const after = await page.evaluate(async id => {
    const response = await fetch(`/api/pages/${id}?draft=true&depth=0`, { signal: AbortSignal.timeout(10_000) })
    if (!response.ok) throw new Error('Restored probe read failed')
    return response.json()
  }, before.id)
  assert.equal(after.deletedAt ?? null, null)
  assert.equal(after._status, 'draft')
  for (const key of ['id', 'title', 'slug', 'layout']) assert.deepEqual(after[key], before[key])
}
