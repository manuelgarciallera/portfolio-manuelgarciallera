import assert from 'node:assert/strict'
import { readFile, mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const css = await readFile('src/features/redesign/redesign.css', 'utf8')
const browser = await chromium.launch()
try {
  await mkdir('tmp/hero-columns', { recursive: true })
  for (const width of [768, 1024, 1280, 1440, 1920]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } })
    await page.setContent(`<style>${css}</style><div class="rd-root"><section class="rd-hero"><div class="rd-hero-copy"><h1>Diseño sistemas digitales que conectan investigación, interfaz y código.</h1></div><div class="rd-hero-art">Manuel García-Llera</div></section></div>`)
    const gap = await page.evaluate(() => document.querySelector('.rd-hero-art').getBoundingClientRect().left - document.querySelector('.rd-hero-copy').getBoundingClientRect().right)
    assert.ok(gap >= 0, `Hero columns overlap at ${width}px: ${gap}px`)
    await page.close()
  }
  console.log('PASS: hero art does not invade copy at 768/1024/1280/1440/1920.')
} finally { await browser.close() }
