import assert from 'node:assert/strict'
import { readFile, mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import sharp from 'sharp'

// A reflection must brighten the existing facet, never replace it with a dark band.
const css = await readFile('src/features/redesign/components/brand-signature.css', 'utf8')
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await mkdir('.audit/brand-reflection', { recursive: true })
  for (const theme of ['dark', 'light']) {
    await page.setContent(`<style>body{background:${theme === 'dark' ? '#0c0e08' : '#fff'};padding:24px}${css}</style><div data-theme="${theme}"><div class="rd-brand-signature"><span class="rd-brand-m"><svg viewBox="0 0 64 64"><path fill="currentColor" d="M4 4L32 32L4 60Z"/></svg><span class="rd-brand-m-color"></span></span></div></div>`)
    const mark = page.locator('.rd-brand-m')
    const rest = await mark.screenshot()
    const original = await sharp(rest).removeAlpha().raw().toBuffer()
    await page.locator('.rd-brand-signature').evaluate(e => e.dataset.touchActive = 'true')
    await page.evaluate(() => document.getAnimations().forEach(a => a.pause()))
    for (const time of [0, 300, 600, 900, 1200]) {
      await page.evaluate(t => document.getAnimations().forEach(a => { a.currentTime = t }), time)
      const rendered = await mark.screenshot({ path: `.audit/brand-reflection/${theme}-${time}.png` })
      {
        const pixels = await sharp(rendered).removeAlpha().raw().toBuffer()
        let brightened = 0
        // Interior of the right facet, avoiding antialiasing and exterior halo.
        for (let y = 6; y < 29; y++) for (let x = y + 3; x < 30; x++) {
          const i = (y * 36 + x) * 3
          for (let c = 0; c < 3; c++) {
            assert.ok(pixels[i+c] >= original[i+c]-2, `no opaque/dark band: ${theme}, ${time}ms, ${x},${y}`)
            if (time === 0 || time === 1200) assert.ok(Math.abs(pixels[i+c]-original[i+c]) <= 2, 'endpoints restore base colors')
          }
          if (pixels[i]+pixels[i+1]+pixels[i+2] > original[i]+original[i+1]+original[i+2]+15) brightened++
        }
        if (time === 600) assert.ok(brightened > 20, 'reflection is visible across the facet')
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  }
  console.log('PASS reflection: no dark band, visible light, restored base colors, both themes, reduced motion')
} finally { await browser.close() }
