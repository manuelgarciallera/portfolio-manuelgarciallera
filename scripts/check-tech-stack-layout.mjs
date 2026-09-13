import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.argv[2] || 'http://127.0.0.1:3015'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const failures = []
try {
  // Global CSS may arrive in either order after client navigation/chunking.
  const sheets = await Promise.all(['redesign', 'responsive'].map(name =>
    readFile(`src/features/redesign/${name}.css`, 'utf8')))
  for (const order of [sheets, [...sheets].reverse()]) {
    await page.setViewportSize({ width: 390, height: 900 })
    await page.setContent('<div class="rd-meta-grid"><div><dd><span class="rd-tech-stack rd-tech-stack--compact"><span class="rd-tech-stack__item">Figma</span><span class="rd-tech-stack__item">Angular</span><span class="rd-tech-stack__item">Node.js</span></span></dd></div></div>')
    for (const content of order) await page.addStyleTag({ content })
    const overflow = await page.locator('.rd-tech-stack').evaluate(el => getComputedStyle(el).overflowX)
    assert.equal(overflow, 'visible', 'stack must not become a scroll region when CSS order changes')
  }
  for (const route of ['buy-sell-marketplace', 'nude-project', 'the-ux-union']) {
    for (const width of [320, 390, 600, 767, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`${base}/casos/${route}`, { waitUntil: 'load' })
      const stack = page.locator('.rd-meta-grid .rd-tech-stack')
      await stack.waitFor()
      const result = await stack.evaluate(el => {
        const rect = el.getBoundingClientRect()
        const style = getComputedStyle(el)
        const items = [...el.children].map(item => {
          const r = item.getBoundingClientRect()
          return { label: item.textContent, left: r.left, right: r.right, top: r.top, bottom: r.bottom }
        })
        return { wrap: style.flexWrap, overflow: style.overflowX, width: el.clientWidth, scroll: el.scrollWidth,
          outside: items.filter(r => r.left < rect.left - 1 || r.right > rect.right + 1 || r.bottom > rect.bottom + 1),
          count: items.length }
      })
      try {
        assert.ok(result.count > 1)
        assert.equal(result.wrap, 'wrap')
        assert.equal(result.overflow, 'visible')
        assert.ok(result.scroll <= result.width + 1)
        assert.deepEqual(result.outside, [])
        console.log(`PASS ${route} ${width}px`)
      } catch (error) {
        failures.push({ route, width, result, error: error.message })
      }
    }
  }
  assert.deepEqual(failures, [])
} finally {
  await browser.close()
}
