import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.PUBLIC_TEST_URL || 'http://127.0.0.1:3197'
const output = process.env.PUBLIC_TEST_OUTPUT || '.audit/public-round-20260922/navigation-final'
await fs.mkdir(output, { recursive: true })
const report = { base, checks: [], errors: [] }
const browser = await chromium.launch()
try {
  for (const width of [320, 390, 768, 1366]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width < 1024 })
    page.on('pageerror', error => report.errors.push(String(error)))
    for (const theme of ['dark', 'light']) {
      await page.goto(base + '/proyectos/coordination-hub', { waitUntil: 'networkidle' })
      assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto', 'Published CSS must not reintroduce animated document navigation')
      await page.evaluate(theme => { localStorage.setItem('rd-theme', theme); document.documentElement.dataset.theme = theme }, theme)
      const closeConsent = page.getByRole('button', { name: 'Rechazar analítica', exact: true })
      if (await closeConsent.isVisible()) await closeConsent.click()
      const menu = page.getByRole('button', { name: 'Abrir menú', exact: true })
      if (await menu.isVisible()) {
        await menu.click()
        const nav = page.locator('#mobile-navigation')
        assert.equal(await nav.locator('a').first().innerText(), 'Inicio')
        await page.screenshot({ path: `${output}/menu-${width}-${theme}.png` })
        await nav.getByRole('link', { name: 'Inicio', exact: true }).click()
        await page.waitForURL(base + '/')
        assert.equal(await menu.getAttribute('aria-expanded'), 'false')
        await page.goto(base + '/proyectos/coordination-hub', { waitUntil: 'networkidle' })
      }
      const contact = width < 1024 ? page.locator('.rd-mobile-contact') : page.locator('.rd-desktop-contact')
      await contact.click()
      await page.waitForURL(base + '/#contacto')
      await page.waitForLoadState('networkidle')
      const heading = page.locator('h2#contacto')
      const landed = await heading.boundingBox()
      assert(landed && landed.y >= 80 && landed.y <= 150, `Contact landing ${width}/${theme}: ${JSON.stringify(landed)}`)
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Horizontal overflow')
      await page.screenshot({ path: `${output}/contact-${width}-${theme}.png` })
      const footerContact = page.locator('.rd-footer a[href="#contacto"]')
      await footerContact.click()
      const repeated = await heading.boundingBox()
      assert(repeated && repeated.y >= 80 && repeated.y <= 150, `Repeated contact hash ${width}: ${JSON.stringify(repeated)}`)
      report.checks.push({ width, theme, contactY: landed.y, repeatedY: repeated.y })
    }
    await page.close()
  }
  assert.equal(report.errors.length, 0, report.errors.join('\n'))
} catch (error) { report.failure = String(error.stack ?? error); process.exitCode = 1 }
finally { await browser.close(); await fs.writeFile(output + '/results.json', JSON.stringify(report, null, 2)) }
console.log(JSON.stringify(report, null, 2))
