import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdir, readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.CV_TEST_URL || 'http://127.0.0.1:3014'
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Local verification only')
const browser = await chromium.launch()
const results = []
try {
  for (const width of [320, 390, 768, 1440]) {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, acceptDownloads: true, reducedMotion: 'reduce' })
      const page = await context.newPage()
      const pdfRequests = []
      const errors = []
      page.on('request', request => { if (request.url().includes('/cv/')) pdfRequests.push(request.url()) })
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`${base}/sobre-mi`, { waitUntil: 'networkidle' })
      await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme)
      const trigger = page.locator('summary', { hasText: 'Descargar CV' })
      await trigger.scrollIntoViewIfNeeded()
      assert.deepEqual(pdfRequests, [], 'PDF must not load before selection')
      await trigger.focus()
      await page.keyboard.press('Enter')
      const chooser = page.locator('details').filter({ has: trigger })
      assert.equal(await chooser.getAttribute('open'), '')
      const links = chooser.locator('a')
      assert.equal(await links.count(), 2)
      await page.keyboard.press('Tab')
      assert.equal(await links.nth(0).evaluate(el => el === document.activeElement), true)
      for (let index = 0; index < 2; index++) {
        const link = links.nth(index)
        const bounds = await link.boundingBox()
        assert.ok(bounds && bounds.height >= 44 && bounds.x >= 0 && bounds.x + bounds.width <= width)
        const href = await link.getAttribute('href')
        const downloadEvent = page.waitForEvent('download')
        await link.click()
        const download = await downloadEvent
        assert.equal(await download.failure(), null)
        assert.equal(download.suggestedFilename(), await link.getAttribute('download'))
        const actual = await readFile(await download.path())
        const original = await readFile(`public${href}`)
        assert.equal(createHash('sha256').update(actual).digest('hex'), createHash('sha256').update(original).digest('hex'))
      }
      assert.deepEqual(errors, [])
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
      if (width === 390 || width === 1440) {
        await mkdir('tmp/cv-verification', { recursive: true })
        await chooser.locator('..').screenshot({ path: `tmp/cv-verification/${width}-${theme}.png` })
      }
      results.push({ width, theme, downloads: 2, errors: 0 })
      await context.close()
    }
  }
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto(`${base}/sobre-mi`, { waitUntil: 'domcontentloaded' })
  const trigger = page.locator('summary', { hasText: 'Descargar CV' })
  assert.equal(await trigger.evaluate(el => {
    for (let node = el; node; node = node.parentElement) {
      if (Number(getComputedStyle(node).opacity) !== 1) return false
    }
    return true
  }), true, 'CV access must be painted without JavaScript')
  await trigger.click()
  assert.equal(await page.getByRole('link', { name: 'English' }).isVisible(), true)
  await context.close()
  console.log(JSON.stringify({ results, noJavaScript: 'passed' }, null, 2))
} finally {
  await browser.close()
}
