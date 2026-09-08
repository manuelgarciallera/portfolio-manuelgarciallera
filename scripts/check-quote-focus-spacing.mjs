import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const css = await readFile(new URL('../src/features/redesign/redesign.css', import.meta.url), 'utf8')
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const width of [1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.setContent('<div class="rd-root"><section class="rd-quote-panel"><blockquote class="rd-principle"><p>«Cada principio es el momento ideal para cuidar atentamente que los equilibrios queden establecidos de la manera más exacta.»</p><cite>Frank Herbert · Dune</cite></blockquote></section><section class="rd-section" id="enfoque"><p class="rd-label">Enfoque</p><h2>Diseño y construyo productos digitales</h2></section></div>')
    await page.addStyleTag({ content: css })
    const gap = await page.evaluate(() => document.querySelector('#enfoque .rd-label').getBoundingClientRect().top - document.querySelector('cite').getBoundingClientRect().bottom)
    assert.ok(gap >= 40 && gap <= 290, `${width}px: expected a readable transition, got ${gap}px`)
    console.log(`${width}px: ${Math.round(gap)}px between attribution and Enfoque`)
  }
} finally {
  await browser.close()
}
