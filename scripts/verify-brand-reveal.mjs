import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.argv[2] || 'http://localhost:3040'
await mkdir('.audit/brand-reveal', { recursive: true })
const browser = await chromium.launch()
try {
  for (const theme of ['dark', 'light']) for (const width of [390, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.addInitScript(value => localStorage.setItem('rd-theme', value), theme)
    await page.goto(base, { waitUntil: 'networkidle' })
    const privacy = page.getByRole('button', { name: 'Rechazar analítica' })
    if (await privacy.isVisible()) await privacy.click()
    const brand = page.locator('.rd-brand')
    const letters = page.locator('.rd-brand-letters')
    const tint = page.locator('.rd-brand-m-color')
    assert.equal(await page.locator('.rd-brand-signature').evaluate(e => getComputedStyle(e).color), theme === 'dark' ? 'rgb(255, 255, 255)' : 'rgb(0, 0, 0)')
    if (width >= 768) {
      const nav = await page.locator('.rd-desktop-nav').boundingBox()
      assert.equal(await letters.evaluate(e => e.getBoundingClientRect().width), 0)
      await brand.hover()
      await page.waitForFunction(() => document.querySelector('.rd-brand-letters').getBoundingClientRect().width > 100)
      await page.waitForTimeout(250)
      for (const letter of await page.locator('.rd-brand-letter').all()) assert.equal(await letter.evaluate(e => getComputedStyle(e).opacity), '1')
      assert.notEqual(await tint.evaluate(e => getComputedStyle(e).animationName), 'none')
      assert.deepEqual(await page.locator('.rd-desktop-nav').boundingBox(), nav, 'hover does not move navigation')
      const bounds = await letters.boundingBox()
      if (nav?.width) assert.ok(bounds.x + bounds.width < nav.x, 'revealed letters do not overlap desktop links')
      await page.screenshot({ path: `.audit/brand-reveal/${width}-${theme}-hover.png` })
      await page.mouse.move(width - 1, 700)
      await page.waitForTimeout(600)
      assert.equal(await tint.evaluate(e => getComputedStyle(e).animationName), 'none', 'gradient stops off hover')
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await brand.focus()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Shift+Tab')
      assert.equal(await brand.evaluate(e => e.matches(':focus-visible')), true)
      assert.equal(await letters.evaluate(e => e.getBoundingClientRect().width), 112, 'keyboard reveals without motion')
      assert.equal(await tint.evaluate(e => getComputedStyle(e).animationName), 'none')
    } else {
      await brand.hover()
      assert.equal(await letters.evaluate(e => getComputedStyle(e).display), 'none', 'mobile stays compact')
      assert.equal(await tint.evaluate(e => getComputedStyle(e).animationName), 'none')
      await page.screenshot({ path: `.audit/brand-reveal/${width}-${theme}.png` })
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.deepEqual(errors, [])
    console.log(`PASS ${width} ${theme}: theme, reveal, motion, layout, page errors`)
    await page.close()
  }
} finally { await browser.close() }
