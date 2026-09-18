import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const browser = await chromium.launch()
const base = process.env.HERO_TEST_URL || 'https://manuelgarciallera.com'
await mkdir('.audit/nav-underline', { recursive: true })
try {
  for (const width of [320, 390, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    await page.goto(`${base}/articulos`, { waitUntil: 'networkidle' })
    const mobile = width < 1180
    if (mobile) await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
    const nav = page.locator(mobile ? '#mobile-navigation' : '.rd-desktop-nav')
    const active = nav.locator('[aria-current="page"]')
    await active.waitFor({ state: 'visible' })
    const before = await active.boundingBox()
    for (const theme of ['initial', 'alternate']) {
      const style = await active.evaluate(el => {
        const s = getComputedStyle(el)
        return { offset: parseFloat(s.textUnderlineOffset) / parseFloat(s.fontSize), skip: s.textDecorationSkipInk, line: s.textDecorationLine, thickness: s.textDecorationThickness }
      })
      assert.ok(style.offset >= 0 && style.offset <= 0.1, `underline close to baseline at ${width}: ${JSON.stringify(style)}`)
      assert.equal(style.skip, 'none')
      assert.equal(style.line, 'underline')
      assert.equal(style.thickness, '1px')
      const after = await active.boundingBox()
      assert.deepEqual(after, before, 'decoration must not move text')
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      await page.screenshot({ path: `.audit/nav-underline/${width}-${theme}.png` })
      if (theme === 'initial') await nav.getByRole('button', { name: /Activar tema/ }).click()
    }
    if (mobile) {
      assert.equal(await nav.locator('summary').textContent(), 'Descargar CV')
      await page.keyboard.press('Escape')
      assert.equal(await page.getByRole('button', { name: 'Abrir menú', exact: true }).getAttribute('aria-expanded'), 'false')
    }
    await page.close()
  }
  console.log('PASS active underline: baseline proximity, continuous 1px line, unchanged geometry, 4 widths/2 themes, CV and Escape retained')
} finally { await browser.close() }
