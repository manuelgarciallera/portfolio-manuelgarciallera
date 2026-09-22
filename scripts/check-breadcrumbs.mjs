import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const origin = new URL(process.argv[2] || 'http://127.0.0.1:3197').origin
const smoke = process.argv.includes('--smoke')
const output = path.resolve('.audit/breadcrumbs', new Date().toISOString().replaceAll(':', '-'))
mkdirSync(output, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []
try {
  for (const width of smoke ? [390] : [320, 390, 768, 1366]) for (const theme of smoke ? ['dark'] : ['dark', 'light']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 769, reducedMotion: 'reduce' })
    await context.addInitScript(value => localStorage.setItem('rd-theme', value), theme)
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    const routes = ['/proyectos', '/proceso', '/investigacion', '/sobre-mi', '/blog', '/proyectos/buy-sell-marketplace', '/blog/interfaces-para-roles-y-estados-complejos']
    for (const route of smoke ? routes.slice(0, 3) : routes) {
      const checks = []
      try {
        const response = await page.goto(origin + route, { waitUntil: 'networkidle' })
        assert.equal(response.status(), 200)
        const nav = page.getByRole('navigation', { name: 'Migas de pan', exact: true })
        await nav.waitFor()
        if (!route.startsWith('/blog')) await page.waitForFunction(value => document.documentElement.dataset.theme === value, theme)
        const measured = await nav.evaluate(node => {
          const links = [...node.querySelectorAll('a')].map(link => {
            const s = getComputedStyle(link), r = link.getBoundingClientRect()
            return { label: link.textContent, href: link.getAttribute('href'), height: r.height, width: r.width,
              x: r.x, right: r.right, border: s.borderTopWidth, style: s.borderTopStyle,
              radius: s.borderTopLeftRadius, color: s.color, padding: s.padding, borderColor: s.borderTopColor }
          })
          const current = node.querySelector('[aria-current="page"]')
          return { links, currentTag: current?.tagName, currentCount: node.querySelectorAll('[aria-current="page"]').length,
            overflow: document.documentElement.scrollWidth > innerWidth, viewport: innerWidth }
        })
        checks.push(measured)
        assert.equal(measured.links[0].label, 'Inicio')
        assert.equal(measured.links[0].href, '/')
        assert.equal(measured.currentCount, 1)
        assert.equal(measured.currentTag, 'SPAN', 'Current page must remain distinct from navigation links')
        assert.equal(measured.overflow, false)
        for (const link of measured.links) {
          assert.equal(link.border, '1px', `${route}: ${link.label} requires its capsule border`)
          assert.equal(link.style, 'solid')
          assert(parseFloat(link.radius) >= link.height / 2, `${route}: pill radius`)
          assert(link.height >= 44 && link.width >= 44, `${route}: usable target size`)
          assert(link.x >= 0 && link.right <= width + 1, `${route}: link within viewport`)
        }
        const home = nav.getByRole('link', { name: 'Inicio', exact: true })
        await home.focus()
        await page.keyboard.press('Tab')
        await page.keyboard.press('Shift+Tab')
        assert(await home.evaluate(node => node === document.activeElement && node.matches(':focus-visible')))
        assert(await home.evaluate(node => parseFloat(getComputedStyle(node).outlineWidth) >= 2))
        if (!smoke && [390, 1366].includes(width)) await nav.screenshot({ path: path.join(output, `${route.replaceAll('/', '-')}-${width}-${theme}.png`) })
        await home.click()
        await page.waitForURL(origin + '/')
        assert.equal(await page.evaluate(() => scrollY < 2), true, 'Home link lands at the start')
        assert.deepEqual(errors, [])
        results.push({ route, width, theme, pass: true, checks })
      } catch (error) {
        results.push({ route, width, theme, pass: false, error: error.message, checks })
      }
    }
    await context.close()
  }
} finally { await browser.close() }
writeFileSync(path.join(output, 'results.json'), JSON.stringify({ origin, results }, null, 2))
console.log(JSON.stringify({ origin, passed: results.filter(row => row.pass).length, total: results.length,
  failures: results.filter(row => !row.pass).map(({ route, width, theme, error }) => ({ route, width, theme, error })), output }, null, 2))
process.exitCode = results.every(row => row.pass) ? 0 : 1
