import assert from 'node:assert/strict'
import { chromium } from 'playwright'

export const verifyProductionBrowserLogin = async (origin, credentials) => {
  const url = new URL(origin)
  assert.equal(url.hostname, '127.0.0.1')
  assert(credentials.email.endsWith('@example.invalid'))
  const browser = await chromium.launch()
  try {
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } })
      try {
        const page = await context.newPage()
        page.setDefaultTimeout(15_000)
        const errors = []
        page.on('pageerror', error => errors.push(error.message))
        await page.goto(`${origin}/admin/collections/pages`, { waitUntil: 'domcontentloaded' })
        await page.waitForURL(url => url.pathname === '/admin/login')
        await page.locator('input[name="email"]').fill(credentials.email)
        const password = page.locator('input[name="password"]')
        await password.fill(`${credentials.password}-incorrect`)
        const rejected = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/users/login')
        await password.press('Enter')
        assert.equal((await rejected).status(), 401)
        const session = () => page.evaluate(async () => {
          const response = await fetch('/api/users/me', { signal: AbortSignal.timeout(10_000) })
          if (!response.ok) throw new Error('Browser session lookup failed')
          return response.json()
        })
        assert.equal((await session()).user, null)
        await password.fill(credentials.password)
        const accepted = page.waitForResponse(response => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/users/login')
        await password.press('Enter')
        assert.equal((await accepted).status(), 200)
        await page.waitForURL(url => url.pathname === '/admin/collections/pages')
        assert.equal((await session()).user?.email, credentials.email)
        await page.reload({ waitUntil: 'domcontentloaded' })
        await page.getByRole('link', { name: 'Cuenta', exact: true }).waitFor()
        assert.equal((await session()).user?.email, credentials.email)
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        assert.deepEqual(errors, [])
        console.log(`[production-browser] PASS ${width}px keyboard login and cookie session`)
      } finally { await context.close() }
    }
  } finally { await browser.close() }
}
