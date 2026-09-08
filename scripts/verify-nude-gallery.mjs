import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'

const base = process.argv[2] || 'http://127.0.0.1:3015'
const out = '.tmp-screens/nude-gallery/verification'
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []
try {
  for (const width of [360, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, hasTouch: width < 900, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    for (const theme of ['light', 'dark']) {
      await page.goto(base, { waitUntil: 'networkidle' })
      await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme)
      const gallery = page.locator('.rd-art-gallery')
      await gallery.scrollIntoViewIfNeeded()
      const links = gallery.getByRole('link')
      assert.equal(await links.count(), 5)
      assert.equal(await links.last().getAttribute('href'), '/casos/nude-project')
      const track = gallery.getByRole('region')
      await track.focus()
      await page.keyboard.press('End')
      await links.last().focus()
      assert.ok(await track.evaluate(el => el.scrollLeft > 0), 'keyboard exposes the final card')
      await track.evaluate(el => { el.scrollLeft = 0 })
      await page.waitForTimeout(250)
      await gallery.screenshot({ path: `${out}/gallery-${width}-${theme}.png` })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      const card = page.locator('[data-case-preview="nude-project"]')
      await card.scrollIntoViewIfNeeded()
      await card.screenshot({ path: `${out}/cover-${width}-${theme}.png` })
      await page.goto(`${base}/casos/nude-project`, { waitUntil: 'networkidle' })
      await page.evaluate(value => document.documentElement.setAttribute('data-theme', value), theme)
      assert.equal(await page.getByRole('heading', { level: 1 }).innerText(), 'NudeProject')
      assert.equal(await page.getByRole('link', { name: 'Ver la implementación', exact: false }).count(), 0)
      const feature = page.locator('.rd-case-feature--nude-project')
      await feature.scrollIntoViewIfNeeded()
      await feature.getByRole('button', { name: 'Comprar', exact: true }).click()
      assert.equal(await feature.locator('.rd-preview-slide[data-active="true"] img').getAttribute('alt'), 'Bolsa del prototipo NudeProject con tallas, cantidades y total')
      await feature.screenshot({ path: `${out}/feature-${width}-${theme}.png` })
      const figure = page.locator('.rd-visual-journey figure').first()
      await figure.scrollIntoViewIfNeeded()
      await figure.screenshot({ path: `${out}/journey-${width}-${theme}.png` })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      assert.equal(await page.locator('.rd-next-case a[href="/casos/buy-sell-marketplace"]').count() > 0, true)
      results.push({ width, theme, galleryLinks: 5, navigation: 'passed', errors: [...errors] })
      assert.deepEqual(errors, [])
    }
    await context.close()
  }
  await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results, null, 2))
} finally { await browser.close() }
