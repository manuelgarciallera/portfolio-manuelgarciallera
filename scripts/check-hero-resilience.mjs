import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'
import sharp from 'sharp'

const browser = await chromium.launch()
const base = process.env.HERO_TEST_URL || 'http://127.0.0.1:3028'
await mkdir('tmp/hero-resilience', { recursive: true })
try {
  for (const mode of ['normal', 'reduced', 'gpu-unavailable']) {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 }, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference' })
    await page.addInitScript(() => {
      window.__wordmarkDraws = []
      const fill = CanvasRenderingContext2D.prototype.fillText
      CanvasRenderingContext2D.prototype.fillText = function(text, ...args) {
        if (['Manuel', 'García-Llera', 'Añón', 'Manuel García-Llera Añón'].includes(text)) window.__wordmarkDraws.push({ text, font: this.font })
        return fill.call(this, text, ...args)
      }
    })
    if (mode === 'gpu-unavailable') await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return /webgl/.test(type) ? null : original.call(this, type, ...args)
      }
    })
    const images = []
    page.on('request', request => { if (request.url().includes('hero-refractive-orb-fallback')) images.push(request.url()) })
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 })
    const art = page.locator('.rd-hero-art')
    if (mode === 'normal') {
      await page.locator('.rd-hero-art[data-ready="true"]').waitFor({ timeout: 30000 })
      await page.waitForTimeout(800)
      assert.equal(images.length, 0, 'Normal loading must not download/flash the unrelated fallback orb')
      const picture = await art.screenshot({ path: 'tmp/hero-resilience/orb.png' })
      const { width, height } = await sharp(picture).metadata()
      const sample = await sharp(picture).extract({ left: Math.floor(width * .47), top: Math.floor(height * .32), width: 16, height: 16 }).toBuffer()
      const stats = await sharp(sample).stats()
      const luminance = stats.channels.slice(0, 3).reduce((sum, channel) => sum + channel.mean, 0) / 3
      console.log(JSON.stringify({ mode, luminance }))
      assert.ok(luminance >= 140, 'The pearl should read as light, not as a dark ball')
      const typography = await page.evaluate(() => {
        const heading = getComputedStyle(document.querySelector('.rd-hero-copy h1'))
        const probe = document.createElement('canvas').getContext('2d')
        probe.font = `${heading.fontWeight} 128px ${heading.fontFamily}`
        return { expected: probe.font, draws: window.__wordmarkDraws }
      })
      assert.ok(typography.draws.some(draw => draw.text === 'Añón' && draw.font === typography.expected), 'WebGL name must use the real heading font and weight')
    } else {
      await page.locator('.rd-hero-static-orb').waitFor({ timeout: 20000 })
      await page.locator('.rd-hero-fallback-name').waitFor({ state: 'visible' })
      assert.equal(await page.locator('.rd-hero-fallback-name').innerText(), 'Manuel García-Llera Añón')
      assert.equal(await art.locator('canvas').count(), 0)
    }
    await page.screenshot({ path: `tmp/hero-resilience/${mode}.png` })
    await page.close()
  }
} finally { await browser.close() }
