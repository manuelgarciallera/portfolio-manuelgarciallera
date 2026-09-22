import fs from 'node:fs'
import path from 'node:path'
import { chromium, type Browser, type Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const css = ['redesign.css', 'contact.css']
  // External stylesheet decoding strips the UTF-8 BOM; inline style fixtures
  // must do the same or Chromium discards the first :root rule.
  .map(file => fs.readFileSync(path.join(process.cwd(), 'src/features/redesign', file), 'utf8').replace(/^\uFEFF/, '')).join('\n')
let browser: Browser
let page: Page
beforeAll(async () => { browser = await chromium.launch(); page = await browser.newPage({ reducedMotion: 'reduce' }) }, 60000)
afterAll(async () => { await browser?.close() })

describe('contact feedback legibility', () => {
  for (const theme of ['dark', 'light']) for (const status of ['success', 'error']) {
    it(`keeps ${status} feedback readable on the ${theme} contact surface`, async () => {
        await page.setContent(`<html data-theme="${theme}"><style>${css}</style><div class="rd-root"><section class="rd-contact"><p class="rd-contact-form__status is-${status}">Estado del envío <a href="mailto:test@example.invalid">Enviarlo por correo</a></p></section></div></html>`)
        await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
        const ratios = await page.locator('.rd-contact-form__status').evaluate(element => {
          const luminance = (color: string) => {
            const values = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(value => {
              const channel = value / 255
              return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
            })
            return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722
          }
          const background = luminance(getComputedStyle(element.parentElement!).backgroundColor)
          return [element, element.querySelector('a')!].map(node => {
            const foreground = luminance(getComputedStyle(node).color)
            return { ratio: (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05), color: getComputedStyle(node).color, background: getComputedStyle(element.parentElement!).backgroundColor }
          })
        })
        for (const result of ratios) expect(result.ratio, JSON.stringify(result)).toBeGreaterThanOrEqual(4.5)
    }, 60000)
  }
})
