import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.HERO_TEST_URL || 'http://127.0.0.1:3037'
const browser = await chromium.launch()
await mkdir('.audit/mobile-cv', { recursive: true })
try {
  for (const [width, height] of [[320, 568], [390, 844], [768, 900], [1280, 900]]) {
    const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    for (const route of ['/', '/articulos', '/sobre-mi']) {
      await page.goto(`${base}${route}`, { waitUntil: 'networkidle' })
      const nav = page.locator('#mobile-navigation')
      if (width >= 1180) {
        assert.equal(await nav.isVisible(), false)
        assert.equal(await page.locator('.rd-desktop-nav').getByText('Descargar CV').count(), 0)
        continue
      }
      await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
      const summary = nav.locator('summary')
      await summary.click()
      assert.equal(await nav.locator('details').getAttribute('open'), '')
      assert.equal(await nav.locator('a[download]').count(), 2)
      for (const link of await nav.locator('a[download]').all()) {
        const downloadPromise = page.waitForEvent('download')
        await link.click()
        const download = await downloadPromise
        assert.equal(await download.failure(), null)
        assert.match(download.suggestedFilename(), /Manuel-Garcia-Llera-CV-(ES|EN)-2026-09-07\.pdf/)
      }
      await summary.focus()
      await page.keyboard.press('Tab')
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('hrefLang')), 'es')
      await summary.click()
      await page.keyboard.press('Tab')
      assert.equal(await nav.locator('button').evaluate(el => el === document.activeElement), true)
      await page.keyboard.press('Tab')
      assert.equal(await nav.locator('a').first().evaluate(el => el === document.activeElement), true)
      await summary.click()
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      await nav.locator('button').scrollIntoViewIfNeeded()
      const themeBox = await nav.locator('button').boundingBox()
      assert.ok(themeBox.y + themeBox.height <= height + 1)
      if (route === '/') {
        await summary.scrollIntoViewIfNeeded()
        await page.screenshot({ path: `.audit/mobile-cv/menu-${width}.png` })
        await nav.locator('button').click()
        await summary.scrollIntoViewIfNeeded()
        await page.screenshot({ path: `.audit/mobile-cv/menu-${width}-alternate-theme.png` })
      }
      await page.keyboard.press('Escape')
      assert.equal(await page.getByRole('button', { name: 'Abrir menú', exact: true }).evaluate(el => el === document.activeElement), true)
      assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden')
      if (route === '/sobre-mi') assert.equal(await page.locator('main summary').filter({ hasText: 'Descargar CV' }).count(), 1)
    }
    assert.deepEqual(errors, [])
    await page.close()
  }
  console.log('PASS mobile CV: 3 routes, 4 viewports, both PDF downloads, dynamic keyboard focus, Escape, scroll reachability, themes, desktop and About preserved')
} finally { await browser.close() }
