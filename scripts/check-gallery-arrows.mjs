import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { chromium } from 'playwright'

const root = new URL('../', import.meta.url)
const css = await readFile(new URL('src/features/redesign/visual-gallery/visual-gallery.css', root), 'utf8')
const source = await readFile(new URL('src/features/redesign/visual-gallery/scrollRail.ts', root), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ reducedMotion: 'reduce' })
  for (const width of [390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.setContent(`<style>:root{--gutter:16px}body{margin:0}</style><div class="rd-art-gallery__controls"><button id="prev">Previous</button><button id="next">Next</button></div><div class="rd-art-gallery__track">${'<a class="rd-art-gallery__item" href="#">Project</a>'.repeat(5)}</div>`)
    await page.addStyleTag({ content: css })
    await page.addScriptTag({ content: `(() => { const exports = {}; ${code}
      const track = document.querySelector('.rd-art-gallery__track');
      document.querySelector('#prev').onclick = () => exports.scrollRail(track, -1);
      document.querySelector('#next').onclick = () => exports.scrollRail(track, 1); })();` })
    assert.equal(await page.locator('#next').isVisible(), width >= 1024)
    if (width < 1024) continue
    await page.locator('#next').click()
    await page.waitForFunction(() => document.querySelector('.rd-art-gallery__track').scrollLeft > 100)
    assert.ok(await page.locator('.rd-art-gallery__track').evaluate(el => el.scrollLeft) > 100)
    await page.locator('#prev').click()
    await page.waitForFunction(() => document.querySelector('.rd-art-gallery__track').scrollLeft < 2)
    assert.ok(await page.locator('.rd-art-gallery__track').evaluate(el => el.scrollLeft) < 2)
    await page.locator('#next').focus()
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.querySelector('.rd-art-gallery__track').scrollLeft > 100)
    assert.ok(await page.locator('.rd-art-gallery__track').evaluate(el => el.scrollLeft) > 100)
    for (let i = 0; i < 8; i++) await page.locator('#next').click()
    await page.waitForFunction(() => { const el = document.querySelector('.rd-art-gallery__track'); return Math.abs(el.scrollWidth - el.clientWidth - el.scrollLeft) < 2 })
    assert.ok(await page.locator('.rd-art-gallery__track').evaluate(el => Math.abs(el.scrollWidth - el.clientWidth - el.scrollLeft) < 2))
  }
  if (process.env.GALLERY_TEST_URL) {
    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(process.env.GALLERY_TEST_URL, { waitUntil: 'domcontentloaded' })
    const next = page.getByRole('button', { name: 'Ver proyectos siguientes' })
    const prev = page.getByRole('button', { name: 'Ver proyectos anteriores' })
    await next.scrollIntoViewIfNeeded()
    await next.click()
    await page.waitForFunction(() => document.querySelector('#art-gallery-track').scrollLeft > 100)
    await prev.click()
    await page.waitForFunction(() => document.querySelector('#art-gallery-track').scrollLeft < 2)
    console.log('PASS: hydrated controls on actual page move the gallery in both directions.')
  }
  console.log('PASS: desktop click/keyboard/edges; mobile/tablet arrows hidden; native scroll retained.')
} finally {
  await browser.close()
}
