import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { mkdir } from 'node:fs/promises'
import { build } from 'esbuild'
import { chromium } from 'playwright'

const directory = fileURLToPath(new URL('../', import.meta.url))
const stub = fileURLToPath(new URL('./document-controls-context.fixture.tsx', import.meta.url))
const bundle = await build({
  absWorkingDir: directory, entryPoints: ['tests/document-controls.fixture.tsx'], bundle: true,
  write: false, outdir: 'unused-output', format: 'iife', jsx: 'automatic',
  alias: { '@payloadcms/ui': stub, 'next/link': stub },
})
const js = bundle.outputFiles.find((file) => file.path.endsWith('.js')).text
const css = bundle.outputFiles.find((file) => file.path.endsWith('.css')).text
const cases = [
  { key: 'bundle', phrase: 'APROBAR PAQUETE', path: '/api/owner/publication-bundles/100/review', body: { confirmation: 'APROBAR PAQUETE', decision: 'approved', note: 'Review note' }, response: { review: { id: 201, decision: 'approved' } }, link: '/admin/collections/publication-reviews/201' },
  { key: 'review', phrase: 'GENERAR ARTEFACTO', path: '/api/owner/publication-reviews/100/artifacts', body: { confirmation: 'GENERAR ARTEFACTO' }, response: { artifact: { id: 202 } }, link: '/admin/collections/publication-artifacts/202' },
  { key: 'artifact', phrase: 'VALIDAR ARTEFACTO', path: '/api/owner/publication-artifacts/100/preflights', body: { confirmation: 'VALIDAR ARTEFACTO' }, response: { preflight: { href: '/admin/collections/publication-preflights/203', issueCount: 0, status: 'ready' } }, link: '/admin/collections/publication-preflights/203' },
  { key: 'figmaPlan', phrase: 'APROBAR IMPORTACIÓN FIGMA', path: '/api/owner/figma/import-plans/100/review', body: { confirmation: 'APROBAR IMPORTACIÓN FIGMA', decision: 'approved', note: 'Review note' }, response: { review: { id: 204, decision: 'approved' } }, link: '/admin/collections/figma-import-reviews/204' },
  { key: 'figmaReview', phrase: 'IMPORTAR PNG DE FIGMA', path: '/api/owner/figma/import-reviews/100/execute', body: { confirmation: 'IMPORTAR PNG DE FIGMA', alt: 'Accessible QA image' }, response: { execution: { id: 205, media: 206, placement: 207 } }, link: '/admin/collections/media-placements/207' },
  { key: 'assistance', phrase: 'ACEPTAR PROPUESTA', path: '/api/owner/assist/proposals/100', method: 'PATCH', body: { confirmation: 'ACEPTAR PROPUESTA', decision: 'accepted', note: 'Review note' }, response: { proposal: { id: 100, status: 'accepted' } } },
  { key: 'bundle', decision: 'rejected', phrase: 'RECHAZAR PAQUETE', path: '/api/owner/publication-bundles/100/review', body: { confirmation: 'RECHAZAR PAQUETE', decision: 'rejected', note: 'Review note' }, response: { review: { id: 208, decision: 'rejected' } }, link: '/admin/collections/publication-reviews/208' },
  { key: 'figmaPlan', decision: 'rejected', phrase: 'RECHAZAR IMPORTACIÓN FIGMA', path: '/api/owner/figma/import-plans/100/review', body: { confirmation: 'RECHAZAR IMPORTACIÓN FIGMA', decision: 'rejected', note: 'Review note' }, response: { review: { id: 209, decision: 'rejected' } }, link: '/admin/collections/figma-import-reviews/209' },
  { key: 'assistance', decision: 'rejected', phrase: 'RECHAZAR PROPUESTA', path: '/api/owner/assist/proposals/100', method: 'PATCH', body: { confirmation: 'RECHAZAR PROPUESTA', decision: 'rejected', note: 'Review note' }, response: { proposal: { id: 100, status: 'rejected' } } },
]
const browser = await chromium.launch({ headless: true })
const failures = []
const proposedCopy = `Texto propuesto ${'l'.repeat(180)} <img src=x onerror=alert(1)>`
const comparison = { proposalId: '100', snapshotHash: `sha256:${'a'.repeat(64)}`, appliesChanges: false, changes: [
  { path: '/page/layout/0/heading', label: 'Bloque 1: Titular', operation: 'replace', before: { state: 'captured', text: 'Texto anterior' }, proposed: { state: 'captured', text: proposedCopy } },
  { path: '/page/title', label: 'Título de página', operation: 'replace', before: { state: 'not-captured', text: 'No guardado en esta versión' }, proposed: { state: 'captured', text: 'Título propuesto' } },
] }
try {
  for (const width of [1280, 390]) for (const fixture of cases) {
    const page = await browser.newPage({ viewport: { width, height: 844 } })
    const requests = []
    const errors = []
    let releaseResponse
    const responseGate = new Promise((resolve) => { releaseResponse = resolve })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.hostname !== 'owner-controls.invalid') return route.abort()
      if (url.pathname === '/fixture') return route.fulfill({ contentType: 'text/html', body: '<html><head><link rel="stylesheet" href="/fixture.css"></head><body style="margin:16px;font-family:sans-serif"><div id="root"></div><script src="/fixture.js"></script></body></html>' })
      if (url.pathname === '/fixture.js') return route.fulfill({ contentType: 'text/javascript', body: js })
      if (url.pathname === '/fixture.css') return route.fulfill({ contentType: 'text/css', body: `*{box-sizing:border-box} :root{--theme-text:#eee;--theme-elevation-50:#171717;--theme-input-bg:#222;--theme-elevation-600:#aaa;--theme-elevation-650:#aaa} ${css}` })
      if (url.pathname === '/api/owner/assist/proposals/100' && route.request().method() === 'GET') return route.fulfill({ contentType: 'application/json', body: JSON.stringify({ review: comparison }) })
      requests.push({ path: url.pathname, method: route.request().method(), body: route.request().postDataJSON() })
      await responseGate
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(fixture.response) })
    })
    try {
      await page.goto(`https://owner-controls.invalid/fixture?component=${fixture.key}`)
      await page.getByRole('button').waitFor()
      if (fixture.key === 'assistance') {
        const review = page.getByRole('region', { name: 'Cambios propuestos' })
        await review.getByText('Texto anterior', { exact: true }).waitFor({ timeout: 2000 })
        assert.equal(await review.getByText(proposedCopy, { exact: true }).count(), 1)
        assert.equal(await review.getByText('No guardado en esta versión', { exact: true }).count(), 1)
        assert.equal(await review.locator('img').count(), 0, 'Proposed text must never become executable markup')
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Long proposal text must wrap on mobile')
      }
      assert.equal(await page.locator('form').count(), 1, 'Action controls must not create a nested CMS form')
      if (fixture.decision) await page.getByRole('combobox', { name: 'Decisión', exact: true }).selectOption(fixture.decision)
      const note = page.getByRole('textbox', { name: 'Nota opcional', exact: true })
      if (await note.count()) {
        await note.fill('Review')
        await note.press('Enter')
        assert.equal(await note.inputValue(), 'Review\n', 'Enter in notes must remain a newline')
        await note.fill('Review note')
      }
      const input = page.getByRole('textbox', { name: `Escribe ${fixture.phrase}`, exact: true })
      await input.fill('wrong')
      await input.press('Enter')
      await page.getByRole('status').filter({ hasText: /Escribe|alternativo/ }).waitFor()
      assert.deepEqual(requests, [], 'An invalid confirmation must not reach the transport')
      if (fixture.key === 'figmaReview') await page.getByRole('textbox', { name: 'Texto alternativo', exact: true }).fill('Accessible QA image')
      await input.fill(fixture.phrase)
      for (const control of await page.locator('input, textarea, select, button').all()) {
        const box = await control.boundingBox()
        assert.ok(box && box.x >= 0 && box.x + box.width <= width, 'Every action field must fit the viewport')
      }
      if (width === 1280) await input.press('Enter')
      else await page.getByRole('button').click()
      await page.waitForFunction(() => document.querySelector('button')?.disabled === true)
      for (const control of await page.locator('input, textarea, select, button').all()) {
        assert.equal(await control.isDisabled(), true, 'Pending actions must freeze the submitted decision and fields')
      }
      releaseResponse()
      if (fixture.link) await page.locator(`a[href="${fixture.link}"]`).waitFor()
      else await page.getByText(fixture.decision === 'rejected' ? 'Propuesta rechazada' : 'Propuesta aceptada', { exact: true }).waitFor()
      assert.deepEqual(requests, [{ path: fixture.path, method: fixture.method ?? 'POST', body: fixture.body }])
      if (fixture.link) {
        assert.equal(await page.getByRole('button').isDisabled(), true)
        await input.dispatchEvent('keydown', { key: 'Enter', bubbles: true })
        assert.equal(requests.length, 1, 'Enter must not bypass a completed action')
      }
      assert.equal(await page.locator('body').getAttribute('data-parent-submissions'), null)
      assert.deepEqual(errors, [])
      console.log(`PASS: ${fixture.key} at ${width}px`)
    } catch (error) {
      failures.push(`${fixture.key} at ${width}px: ${error.message}`)
    } finally { releaseResponse(); await page.close() }
  }
  // Read-only archived proposals keep their comparison; errors must not look
  // like an empty/successful review. Only transport and Payload context are fake.
  for (const width of [1280, 390]) for (const failed of [false, true]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors = []
    let releaseReview
    const gate = new Promise((resolve) => { releaseReview = resolve })
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url())
      if (url.hostname !== 'owner-controls.invalid') return route.abort()
      if (url.pathname === '/fixture') return route.fulfill({ contentType: 'text/html', body: '<html><head><link rel="stylesheet" href="/fixture.css"></head><body style="margin:16px;font-family:sans-serif"><div id="root"></div><script src="/fixture.js"></script></body></html>' })
      if (url.pathname === '/fixture.js') return route.fulfill({ contentType: 'text/javascript', body: js })
      if (url.pathname === '/fixture.css') return route.fulfill({ contentType: 'text/css', body: `*{box-sizing:border-box} :root{--theme-text:#171717;--theme-elevation-50:#fafafa;--theme-elevation-200:#ddd;--theme-elevation-650:#555} ${css}` })
      assert.equal(route.request().method(), 'GET', 'Reviewing an archived proposal must not write')
      await gate
      return route.fulfill({ status: failed ? 403 : 200, contentType: 'application/json', body: JSON.stringify(failed ? { error: 'Private server details' } : { review: comparison }) })
    })
    try {
      await page.goto('https://owner-controls.invalid/fixture?component=assistance&status=accepted')
      const review = page.getByRole('region', { name: 'Cambios propuestos' })
      await review.getByRole('status').waitFor()
      assert.equal(await review.getAttribute('aria-busy'), 'true')
      releaseReview()
      if (failed) {
        await review.getByRole('alert').waitFor()
        assert.equal(await review.locator('dd').count(), 0)
        assert.equal((await review.innerText()).includes('Private server details'), false)
      } else {
        await review.getByText('Texto anterior', { exact: true }).waitFor()
        assert.equal(await page.getByRole('button').count(), 0)
        await review.getByText('Referencia de la versión', { exact: true }).focus()
        await page.keyboard.press('Enter')
        await review.getByText(comparison.snapshotHash, { exact: true }).waitFor()
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        const screenshots = new URL('../.data/verification-artifacts/', import.meta.url)
        await mkdir(screenshots, { recursive: true })
        await page.screenshot({ path: fileURLToPath(new URL(`assistance-review-${width}.png`, screenshots)), fullPage: true })
      }
      assert.equal(await review.getAttribute('aria-busy'), 'false')
      assert.deepEqual(errors, [])
      console.log(`PASS: archived assistance ${failed ? 'error' : 'review'} at ${width}px`)
    } catch (error) { failures.push(`Archived assistance at ${width}px: ${error.message}`) }
    finally { releaseReview(); await page.close() }
  }
} finally { await browser.close() }
assert.deepEqual(failures, [], 'Document control regressions')
