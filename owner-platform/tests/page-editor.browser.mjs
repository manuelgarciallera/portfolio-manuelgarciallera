import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { chromium } from 'playwright'
import { verifyRestoreFlow } from './restore-flow.browser.mjs'

const base = 'http://127.0.0.1:3013'
const { OWNER_QA_EMAIL: email, OWNER_QA_PASSWORD: password } = process.env
if (!email?.endsWith('@example.invalid') || !password) throw new Error('Use an isolated synthetic QA owner')
const browser = await chromium.launch({ headless: true })
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width === 390 })
    const request = context.request
    const login = await request.post(`${base}/api/users/login`, { data: { email, password } })
    assert.equal(login.status(), 200)
    const post = async (path, data) => {
      const response = await request.post(base + path, { data })
      assert.equal(response.status(), 201, await response.text())
      return response.json()
    }
    const brands = await request.get(`${base}/api/brand-profiles?where[slug][equals]=qa-workflow-brand&depth=0`)
    assert.equal(brands.status(), 200)
    const brand = (await brands.json()).docs[0]
    assert.ok(brand, 'Seed the isolated workflow QA first')
    const title = `QA editorial ${randomUUID()}`
    const created = await post('/api/pages', {
      title, slug: `qa-editorial-${randomUUID()}`, brandProfile: brand.id, _status: 'published',
      layout: [{ blockType: 'hero', heading: 'QA only' }, { blockType: 'hero', heading: 'Second section' }],
    })
    const id = created.doc.id
    const read = async draft => {
      const response = await request.get(`${base}/api/pages/${id}?draft=${draft}&depth=0`)
      assert.equal(response.status(), 200)
      return response.json()
    }
    const original = await read(false)
    const preview = (await post('/api/owner/preview-snapshots', { pageId: id })).snapshot
    const snapshot = (await post('/api/owner/draft-snapshots', { pageId: id })).snapshot
    const name = `QA restore ${randomUUID()}`
    await post('/api/owner/releases', {
      name, confirmation: 'REGISTRAR VERSIÓN', changeSummary: 'Synthetic QA evidence, not production measurements',
      gitCommit: randomBytes(20).toString('hex'), previewSnapshot: preview.id, draftSnapshot: snapshot.id,
      quality: [{ viewport: width === 390 ? 'mobile' : 'desktop', performance: 80, usability: 80, accessibility: 80, source: 'manual', measuredAt: new Date().toISOString() }],
    })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/admin/collections/pages/${id}`, { waitUntil: 'networkidle', timeout: 120_000 })
    await page.locator('form[data-form-ready="true"]').first().waitFor()
    await page.locator('#field-title').fill(`${title} edited`)
    const headings = page.locator('input[id$="__heading"]')
    assert.equal(await headings.count(), 2)
    await headings.first().fill('Edited hero')
    const rowMenu = page.locator('.blocks-field .array-actions__button').nth(1)
    await rowMenu.click()
    await page.locator('.array-actions__move-up').click()
    assert.equal(await headings.first().inputValue(), 'Second section', 'Move up must reorder actual form state')
    const saving = page.waitForResponse(response => response.request().method() === 'PATCH' && new URL(response.url()).pathname === `/api/pages/${id}`)
    await page.locator('#action-save-draft').click()
    assert.equal((await saving).status(), 200)
    await page.waitForFunction(() => document.querySelector('#action-save-draft')?.disabled === true)
    const draft = await read(true)
    assert.equal(draft.title, `${title} edited`)
    assert.equal(draft._status, 'draft')
    assert.deepEqual(draft.layout.map(block => block.heading), ['Second section', 'Edited hero'])
    const published = await read(false)
    assert.equal(published.title, original.title)
    assert.deepEqual(published.layout, original.layout, 'Saving a reordered draft must preserve published layout')
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await page.locator('#field-title').inputValue(), `${title} edited`)
    assert.equal(await headings.first().inputValue(), 'Second section')
    const popup = context.waitForEvent('page')
    await page.getByRole('link', { name: /Ver borrador guardado/ }).click()
    const previewPage = await popup
    await previewPage.waitForURL(`${base}/admin/content-preview/pages/${id}`)
    await previewPage.getByRole('heading', { name: 'Second section', exact: true }).waitFor()
    assert.deepEqual(await previewPage.locator('article [data-block-type="hero"] :is(h1,h2)').allTextContents(), ['Second section', 'Edited hero'])
    await previewPage.close()
    const anonymous = await browser.newContext()
    // A streamed Next response may encode the redirect after HTTP headers.
    // Assert the visitor's actual destination and absence of private content.
    const visitor = await anonymous.newPage()
    await visitor.goto(`${base}/admin/content-preview/pages/${id}`, { waitUntil: 'domcontentloaded' })
    await visitor.waitForURL(url => url.pathname === '/admin/login')
    assert.equal(await visitor.getByRole('heading', { name: 'Edited hero', exact: true }).count(), 0)
    await anonymous.close()
    await page.goto(`${base}/admin`, { waitUntil: 'networkidle' })
    const overview = page.getByRole('region', { name: 'Estado editorial' })
    await overview.waitFor()
    await verifyRestoreFlow({ page, request, overview, pageId: id, name, originalTitle: title, base })
    assert.deepEqual((await read(true)).layout.map(block => block.heading), ['QA only', 'Second section'], 'Restoration must preserve every block and its original order')
    assert.deepEqual(errors, [])
    console.log(`PASS page editor ${width}px: edit, reorder, save, reload, private preview, published isolation and confirmed restoration`)
    await context.close()
  }
} finally { await browser.close() }
