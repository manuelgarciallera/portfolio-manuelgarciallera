import assert from 'node:assert/strict'
import { chromium } from 'playwright'

// Only the fresh synthetic QA server used by seed-workflow-qa.mjs.
const base = 'http://127.0.0.1:3013'
const { OWNER_QA_EMAIL: email, OWNER_QA_PASSWORD: password } = process.env
if (!email?.endsWith('@example.invalid') || !password) throw new Error('Use an isolated synthetic QA owner')

const browser = await chromium.launch()
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/admin/collections/pages`, { waitUntil: 'domcontentloaded', timeout: 120_000 })
    await page.waitForURL(url => url.pathname === '/admin/login')
    const emailField = page.locator('input[name="email"]')
    const passwordField = page.locator('input[name="password"]')
    await emailField.fill(email)
    await passwordField.fill(`${password}-incorrect`)
    const failed = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/users/login')
    await passwordField.press('Enter')
    const rejection = await failed
    assert.equal(rejection.status(), 401, 'Invalid login must fail, not create a session')
    // Payload's visible error toast is announced by a polite live region.
    await page.locator('[aria-live="polite"]').getByText(/incorrect|inválid|invalid/i).first().waitFor()
    assert.equal(new URL(page.url()).pathname, '/admin/login')
    const anonymous = await context.request.get(`${base}/api/users/me`)
    assert.equal(anonymous.status(), 200)
    assert.equal((await anonymous.json()).user, null, 'Failed login must not authenticate the browser')
    await passwordField.fill(password)
    const loggedIn = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/users/login')
    await passwordField.press('Enter')
    assert.equal((await loggedIn).status(), 200)
    await page.waitForURL(url => url.pathname === '/admin/collections/pages')
    const authenticated = await context.request.get(`${base}/api/users/me`)
    assert.equal(authenticated.status(), 200)
    assert.equal((await authenticated.json()).user.email, email)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: 'Cuenta', exact: true }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.deepEqual(errors, [])
    console.log(`PASS login UI ${width}px: reject invalid credentials, explain error, keyboard login, safe redirect and persisted session`)
    await context.close()
  }
} finally { await browser.close() }
