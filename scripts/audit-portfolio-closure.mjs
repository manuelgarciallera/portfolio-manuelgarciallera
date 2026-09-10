import { chromium } from 'playwright'
import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'

const require = createRequire(import.meta.url)
const base = process.env.AUDIT_URL || 'http://127.0.0.1:3028'
const routes = ['/', '/sobre-mi', '/proceso', '/investigacion', '/articulos', '/casos', '/casos/buy-sell-marketplace', '/casos/laliga-club-operations-hub', '/casos/coordination-hub', '/casos/the-ux-union', '/casos/nude-project']
const browser = await chromium.launch()
const results = []
await mkdir('tmp/portfolio-closure', { recursive: true })
try {
  for (const width of [390, 1440]) for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    await context.addInitScript(theme => localStorage.setItem('rd-theme', theme), theme)
    for (const route of routes) {
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      const response = await page.goto(base + route, { waitUntil: 'domcontentloaded', timeout: 60000 })
      await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, theme)
      // Exercise lazy assets throughout the page, not just its first screen.
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
          scrollTo(0, y)
          await new Promise(resolve => setTimeout(resolve, 60))
        }
      })
      await page.waitForTimeout(800)
      await page.addScriptTag({ path: require.resolve('axe-core') })
      const violations = await page.evaluate(async () => (await window.axe.run(document, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
      })).violations.map(v => ({ id: v.id, impact: v.impact, targets: v.nodes.map(n => n.target) })))
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        brokenImages: [...document.images].filter(image => image.currentSrc && image.complete && image.naturalWidth === 0).map(image => image.currentSrc),
        h1: document.querySelectorAll('h1').length,
      }))
      const result = { route, width, theme, status: response.status(), errors, ...layout, violations }
      results.push(result)
      console.log(JSON.stringify(result))
      await page.close()
    }
    await context.close()
  }
} finally {
  await browser.close()
  await writeFile('tmp/portfolio-closure/audit.json', JSON.stringify(results, null, 2))
}
if (results.some(r => r.status !== 200 || r.errors.length || r.overflow > 1 || r.brokenImages.length || r.h1 !== 1 || r.violations.length)) process.exitCode = 1
