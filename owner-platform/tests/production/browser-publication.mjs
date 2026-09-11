import assert from 'node:assert/strict'
import { verifyPublicationFlow } from '../publication-flow.browser.mjs'
import { verifyLocalEditorRecovery } from './browser-editor-recovery.mjs'
import { verifyBrowserRestore } from './browser-restore.mjs'

export const verifyBrowserPublication = async ({ page, origin, document, width }) => {
  assert.equal(new URL(origin).hostname, '127.0.0.1')
  assert.match(document.slug, /^estudio-claro-/)
  // Existing workflow helper expects a request-shaped client. Keep requests in
  // the authenticated SPKI-pinned browser, not an unpinned Node TLS context.
  const send = async (url, method, data) => {
    assert.equal(new URL(url).origin, origin)
    const result = await page.evaluate(async ({ url, method, data }) => {
      if (new URL(url).origin !== location.origin) throw new Error('Unexpected fixture origin')
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' },
        ...(data === undefined ? {} : { body: JSON.stringify(data) }), signal: AbortSignal.timeout(15_000) })
      return { status: response.status, text: await response.text() }
    }, { url, method, data })
    return { status: () => result.status, text: async () => result.text, json: async () => JSON.parse(result.text) }
  }
  const request = { get: url => send(url, 'GET'), post: (url, { data }) => send(url, 'POST', data) }
  const create = async (path, data, key) => {
    const response = await request.post(origin + path, { data })
    assert.equal(response.status(), 201, `Synthetic ${key} preparation`)
    return (await response.json())[key]
  }
  // Fixture scores are deliberately marked synthetic: not real quality metrics.
  const preview = await create('/api/owner/preview-snapshots', { pageId: document.id }, 'snapshot')
  const draft = await create('/api/owner/draft-snapshots', { pageId: document.id }, 'snapshot')
  const releaseInput = {
    confirmation: 'REGISTRAR VERSIÓN', name: `Synthetic workflow ${width}`,
    changeSummary: 'QA fixture only. Scores are synthetic, not measured quality.',
    gitCommit: (width === 390 ? 'a' : 'b').repeat(40), previewSnapshot: preview.id, draftSnapshot: draft.id,
    quality: [{ viewport: width === 390 ? 'mobile' : 'desktop', performance: 80, usability: 80,
      accessibility: 80, source: 'manual', measuredAt: new Date().toISOString() }],
  }
  const release = await create('/api/owner/releases', releaseInput, 'release')
  const beforeRelease = await (await request.get(`${origin}/api/releases/${release.id}?depth=0`)).json()
  const duplicate = await request.post(`${origin}/api/owner/releases`, { data: releaseInput })
  assert.equal(duplicate.status(), 409, 'Duplicate release must return a conflict, not an internal error')
  assert.equal((await duplicate.json()).code, 'release_already_registered')
  assert.deepEqual(await (await request.get(`${origin}/api/releases/${release.id}?depth=0`)).json(), beforeRelease)
  const diagnostics = []
  const localEditorResponses = []
  const externalRequests = []
  const externalRequest = request => { const url = new URL(request.url()); if (/^https?:$/.test(url.protocol) && url.origin !== origin) externalRequests.push(url.hostname) }
  const editorResponse = response => {
    const url = new URL(response.url())
    if (url.origin === origin && url.pathname.startsWith('/vendor/monaco/') && response.status() === 200) localEditorResponses.push(url.pathname)
  }
  const failed = request => diagnostics.push({ request: new URL(request.url()).pathname, host: new URL(request.url()).hostname, error: request.failure()?.errorText })
  const consoleError = message => { if (message.type() === 'error') diagnostics.push({ console: message.text() }) }
  page.on('requestfailed', failed)
  page.on('console', consoleError)
  page.on('response', editorResponse)
  page.on('request', externalRequest)
  try {
    await verifyPublicationFlow({ page, request, pageId: document.id, releaseId: release.id,
      name: `Synthetic isolated workflow ${width}`, base: origin })
    await page.locator('.monaco-editor .view-lines').first().waitFor({ state: 'visible', timeout: 30_000 })
    await page.waitForFunction(() => window.monaco?.editor.getModels().some(model => model.getLanguageId() === 'json' && model.getValue().length > 2))
    assert.equal(await page.evaluate(() => {
      const api = window.monaco.editor
      const editors = api.getEditors()
      return editors.length > 0 && editors.every(editor => editor.getOption(api.EditorOption.readOnly))
    }), true, 'Publication evidence editors must retain native read-only protection')
    assert.ok(localEditorResponses.some(url => url.endsWith('/loader.js')), 'Native editor loader must be served locally')
    assert.ok(localEditorResponses.some(url => /\/assets\/json\.worker[^/]*\.js$/.test(url)), 'Native JSON worker must be served locally')
    assert.deepEqual(externalRequests, [], 'Reviewing local evidence must not contact third-party services')
    await verifyLocalEditorRecovery(page)
  } catch (error) {
    console.log('[publication diagnostic]', JSON.stringify(diagnostics))
    throw error
  } finally {
    page.off('requestfailed', failed)
    page.off('console', consoleError)
    page.off('response', editorResponse)
    page.off('request', externalRequest)
  }
  console.log(`[publication-browser] PASS ${width}px review, artifact and preflight UI; no page publication`)
  return verifyBrowserRestore({ page, origin, document, release, width })
}
