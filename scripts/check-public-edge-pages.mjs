import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium, firefox } from 'playwright'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3102'
const output = path.resolve(process.argv[3] ?? '.audit/public-edge-pages-20260923')
const browserName = process.argv[4] ?? 'chromium'
const browserType = { chromium, firefox }[browserName]
assert.ok(browserType, 'Browser must be chromium or firefox')
await fs.mkdir(output, { recursive: true })
const results = []
const browser = await browserType.launch({ headless: true })

try {
  for (const width of [320, 1440]) {
    for (const theme of ['dark', 'light']) {
      for (const route of ['/privacidad', '/ruta-publica-inexistente-verificacion-20260923']) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
        await context.addInitScript(value => localStorage.setItem('rd-theme', value), theme)
        const page = await context.newPage()
        page.setDefaultTimeout(20_000)
        const errors = []
        page.on('pageerror', error => errors.push(error.message))
        try {
          const response = await page.goto(new URL(route, baseUrl).href, { waitUntil: 'domcontentloaded', timeout: 40_000 })
          await page.locator('main h1').waitFor({ state: 'visible' })
          await page.waitForFunction(value => document.documentElement.dataset.theme === value, theme)
          await page.evaluate(async () => { await document.fonts.ready })
          const dismiss = page.getByRole('button', { name: 'Cerrar preferencias sin cambiar la elección' })
          if (await dismiss.isVisible()) await dismiss.click()
          assert.equal(await page.locator('[data-nextjs-dialog], .vite-error-overlay').count(), 0)
          const geometry = await page.locator('main h1').evaluate(title => {
            const rect = title.getBoundingClientRect()
            const style = getComputedStyle(title)
            return { text: title.textContent, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, width: title.clientWidth, scrollWidth: title.scrollWidth, viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth, theme: document.documentElement.dataset.theme, font: [style.fontFamily, style.fontSize, style.lineHeight], color: style.color, surface: getComputedStyle(title.closest('main')).backgroundColor }
          })
          assert.ok(geometry.rect.width > 0 && geometry.rect.height > 0 && geometry.rect.y < 900, 'Heading is not visible on arrival')
          assert.ok(geometry.scrollWidth <= geometry.width + 1, 'Heading text overflows its column')
          assert.ok(geometry.documentWidth <= width + 1 && geometry.bodyWidth <= width + 1, 'Public route has horizontal page overflow')
          const id = `${browserName}-${width}-${theme}-${route === '/privacidad' ? 'privacy' : '404'}`
          await page.screenshot({ path: path.join(output, `${id}.png`) })
          const links = page.locator('main a[href]')
          assert.ok(await links.count() >= 2, 'Public route has no meaningful onward links')
          await page.keyboard.press('Tab')
          const focusChecks = []
          for (const link of await links.all()) {
            await link.focus()
            // Re-enter through a real keyboard traversal. Firefox can retain
            // pointer focus immediately after closing the analytics notice.
            await page.keyboard.press('Tab')
            await page.keyboard.press('Shift+Tab')
            const focus = await link.evaluate(element => {
              const style = getComputedStyle(element)
              let surface = element
              while (surface.parentElement && getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)') surface = surface.parentElement
              const luminance = color => {
                const channels = color.match(/[\d.]+/g).slice(0, 3).map(value => {
                  const channel = Number(value) / 255
                  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
                })
                return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
              }
              const outline = luminance(style.outlineColor)
              const background = luminance(getComputedStyle(surface).backgroundColor)
              return { href: element.getAttribute('href'), active: document.activeElement === element, visible: element.matches(':focus-visible'), width: parseFloat(style.outlineWidth), contrast: (Math.max(outline, background) + 0.05) / (Math.min(outline, background) + 0.05), label: element.textContent.trim() }
            })
            assert.ok(focus.label && /^(?:\/|https:\/\/|mailto:)/.test(focus.href), 'Invalid or unnamed public link')
            assert.ok(focus.active && focus.visible && focus.width >= 2 && focus.contrast >= 3, `${focus.href}: focus is not sufficiently visible`)
            focusChecks.push(focus)
          }
          const firstInternal = page.locator('main a[href^="/"]').first()
          const destination = await firstInternal.getAttribute('href')
          await firstInternal.click()
          await page.waitForURL(new URL(destination, baseUrl).href, { waitUntil: 'domcontentloaded', timeout: 40_000 })
          await page.locator('main h1').waitFor({ state: 'visible' })
          assert.deepEqual(errors, [], 'Browser runtime error')
          results.push({ browser: browserName, width, theme, route, status: response.status(), geometry, focusChecks, navigation: destination, errors })
          console.log(`PASS ${browserName} ${width} ${theme} ${route}`)
        } finally {
          await context.close()
        }
      }
    }
  }
} finally {
  await browser.close()
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2))
}
