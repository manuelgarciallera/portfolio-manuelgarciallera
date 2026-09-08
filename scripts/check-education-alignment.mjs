import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

// Exercises the real stylesheet cascade, including wrapped institution names.
const css = await readFile(new URL('../src/features/redesign/redesign.css', import.meta.url), 'utf8')
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.setContent(`<div class="rd-root"><section class="rd-section"><div class="rd-axes"><article class="rd-axis"><h2 class="rd-case-title">Diseño gráfico publicitario</h2><p class="rd-case-tags rd-education-place">Escuela de Arte · Formación Profesional Superior</p></article><article class="rd-axis"><p class="rd-case-tags" id="unrelated">Research status</p></article></div></section></div>`)
    await page.addStyleTag({ content: css })
    const alignment = await page.locator('.rd-education-place').evaluate(el => getComputedStyle(el).textAlign)
    assert.ok(['left', 'start'].includes(alignment), `${width}px: institution should align left, got ${alignment}`)
    assert.equal(await page.locator('#unrelated').evaluate(el => getComputedStyle(el).textAlign), 'right')
  }
  console.log('PASS: education subtitles left at 390/768/1440; unrelated project tags unchanged.')
} finally {
  await browser.close()
}
