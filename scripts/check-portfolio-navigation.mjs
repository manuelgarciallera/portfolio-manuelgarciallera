import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = process.env.AUDIT_URL || 'http://127.0.0.1:3028'
const browser = await chromium.launch()
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    await page.goto(base + '/sobre-mi', { waitUntil: 'domcontentloaded' })
    if (width < 1180) {
      const toggle = page.locator('.rd-menu-btn')
      await toggle.click()
      const menu = page.getByRole('navigation', { name: 'Principal móvil', exact: true })
      await menu.waitFor({ state: 'visible' })
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true')
      assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden')
      await page.keyboard.press('Escape')
      await page.waitForFunction(() => document.querySelector('.rd-menu-btn').getAttribute('aria-expanded') === 'false')
      assert.equal(await toggle.evaluate(element => element === document.activeElement), true)
      await toggle.click()
      await menu.getByRole('link', { name: 'Proceso', exact: true }).click()
      await page.waitForURL('**/proceso')
      assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden')
    } else {
      await page.getByRole('navigation', { name: 'Principal', exact: true }).getByRole('link', { name: 'Proceso', exact: true }).click()
      await page.waitForURL('**/proceso')
    }
    assert.ok(await page.locator('h1').isVisible())
    console.log(`Navigation, focus and page transition passed: ${width}px`)
    await page.close()
  }
} finally { await browser.close() }
