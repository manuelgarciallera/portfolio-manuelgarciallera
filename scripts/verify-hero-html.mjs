import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const url = process.env.HERO_TEST_URL || 'http://localhost:3015'
assert.ok(['localhost', '127.0.0.1'].includes(new URL(url).hostname), 'local verification only')
const output = '.audit/hero-html-2026-09-16'
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []
try {
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()
    await page.goto(url)
    const name = page.locator('.rd-hero-name')
    await name.waitFor()
    // Dismiss the banner without consenting so the visual review includes the entire name.
    await page.locator('.rd-hero-copy h1').click()
    assert.equal(await name.innerText(), 'Manuel\nGarcía-Llera\nAñón')
    await page.waitForFunction(() => document.querySelector('.rd-hero-art')?.dataset.ready === 'true', null, { timeout: 25000 })
    for (const theme of ['dark', 'light']) {
      const target = theme === 'light' ? 'Activar tema claro' : 'Activar tema oscuro'
      if (width < 768) await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
      const themeButton = page.getByRole('button', { name: target, exact: true })
      if (await themeButton.count()) await themeButton.click()
      if (width < 768) await page.getByRole('button', { name: 'Cerrar menú', exact: true }).click()
      assert.ok(await name.isVisible(), 'name survives WebGL readiness')
      const measured = await name.evaluate(el => {
        const rect = el.getBoundingClientRect()
        const art = el.closest('.rd-hero-art').getBoundingClientRect()
        const selection = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(el)
        selection.removeAllRanges(); selection.addRange(range)
        const selected = selection.toString().replace(/\s+/g, ' ').trim()
        selection.removeAllRanges()
        return { selected, hidden: !!el.closest('[aria-hidden="true"]'),
          fits: rect.bottom <= art.bottom && rect.left >= art.left && rect.right <= art.right,
          overflow: el.scrollWidth > el.clientWidth, select: getComputedStyle(el).userSelect,
          lines: [...el.children].map(child => child.getBoundingClientRect().y) }
      })
      assert.equal(measured.selected, 'Manuel García-Llera Añón')
      assert.equal(measured.hidden, false)
      assert.equal(measured.select, 'text')
      assert.equal(measured.overflow, false)
      assert.ok(measured.fits)
      assert.equal(new Set(measured.lines).size, 3)
      await page.locator('.rd-hero').screenshot({ path: `${output}/${theme}-${width}.png` })
      results.push({ width, theme, ...measured })
    }
    await context.close()
  }
  console.log(JSON.stringify({ result: 'PASS', results, output }))
} finally { await browser.close() }
