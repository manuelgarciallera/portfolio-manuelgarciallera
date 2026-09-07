import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { chromium } from 'playwright'

const base = process.env.OWNER_QA_PORT === '3013' ? 'http://127.0.0.1:3013' : 'http://127.0.0.1:3011'
const { OWNER_QA_EMAIL: email, OWNER_QA_PASSWORD: password } = process.env
if (!email?.endsWith('@example.invalid') || !password) throw new Error('Use an isolated synthetic QA owner.')
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext()
  const request = context.request
  const login = await request.post(`${base}/api/users/login`, { data: { email, password }, timeout: 120_000 })
  assert.equal(login.status(), 200)
  const media = await request.get(`${base}/api/media?limit=1&depth=0&draft=true`)
  assert.equal(media.status(), 200)
  const asset = (await media.json()).docs[0]
  assert.ok(asset?.id, 'Seed the isolated QA media first')
  const page = await context.newPage()
  for (const collection of ['articles', 'projects']) {
    const layoutKey = collection === 'articles' ? 'articleLayout' : 'caseStudyLayout'
    const bodyKey = collection === 'articles' ? 'content' : 'body'
    const title = `QA modular ${randomUUID()}`
    const created = await request.post(`${base}/api/${collection}?draft=true`, { data: {
      title, slug: `qa-${randomUUID()}`, excerpt: 'QA introduction', summary: 'QA introduction', heroImage: asset.id,
      [layoutKey]: [{ blockType: collection === 'articles' ? 'articleQuote' : 'caseQuote', quote: 'Only modular content' }],
    } })
    assert.equal(created.status(), 201)
    const id = (await created.json()).doc.id
    await page.goto(`${base}/admin/collections/${collection}/${id}`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
    await page.locator('form[data-form-ready="true"]').first().waitFor()
    const save = page.locator('#action-save-draft')
    await save.waitFor()
    assert.equal(await save.isDisabled(), true)
    await page.locator('#field-title').fill(`${title} edited`)
    await page.waitForFunction(() => document.querySelector('#action-save-draft')?.disabled === false)
    const saved = page.waitForResponse((response) => response.request().method() === 'PATCH' && new URL(response.url()).pathname === `/api/${collection}/${id}`)
    await save.click()
    assert.equal((await saved).status(), 200, 'The form must not demand unused legacy content')
    await page.waitForFunction(() => document.querySelector('#action-save-draft')?.disabled === true)
    const document = await request.get(`${base}/api/${collection}/${id}?draft=true&depth=0`)
    assert.equal(document.status(), 200)
    const data = await document.json()
    assert.equal(data.title, `${title} edited`)
    assert.equal(data[layoutKey][0].quote, 'Only modular content')
    assert.ok(!JSON.stringify(data[bodyKey] ?? null).includes('Only modular content'), 'Saving must not copy block content into the legacy body')
    await page.reload({ waitUntil: 'domcontentloaded' })
    assert.equal(await page.locator('#field-title').inputValue(), `${title} edited`)
  }
  console.log('PASS: article and project block-only drafts remain editable and persist through the actual Payload form without duplicate legacy text.')
} finally {
  await browser.close()
}
