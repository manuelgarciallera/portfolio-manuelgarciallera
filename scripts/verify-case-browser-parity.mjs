import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, firefox } from 'playwright'

const base = process.argv[2] || 'http://127.0.0.1:3102'
const selected = process.argv[3] || 'both'
const engines = selected === 'both' ? ['chromium', 'firefox'] : [selected]
const output = '.audit/case-browser-parity-20260923'
await mkdir(output, { recursive: true })
// The production sitemap obtains these routes from getPublishedCases() and
// projectHref(); do not maintain a second hard-coded list of public cases.
const response = await fetch(`${base}/sitemap.xml`)
assert.ok(response.ok, `Sitemap HTTP ${response.status}`)
const xml = await response.text()
const routes = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1].replaceAll('&amp;', '&')).pathname)
  .filter(route => /^\/proyectos\/[^/]+\/?$/.test(route))
assert.ok(routes.length > 0, 'Published case routes are missing from the sitemap')
const report = { base, routes, profiles: [], comparisons: [], failures: [] }

try {
  for (const engineName of engines) {
    const engine = { chromium, firefox }[engineName]
    assert.ok(engine, `Unknown browser: ${engineName}`)
    assert.ok(existsSync(engine.executablePath()), `${engineName} is not installed; no installation attempted`)
    const browser = await engine.launch()
    try {
      for (const width of [390, 768, 1366]) for (const theme of ['dark', 'light']) {
        const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion: 'reduce' })
        await context.addInitScript(value => localStorage.setItem('rd-theme', value), theme)
        const page = await context.newPage()
        let runtimeErrors = []
        page.on('pageerror', error => runtimeErrors.push(error.message))
        try {
          for (const route of routes) {
            runtimeErrors = []
            const profile = { engine: engineName, version: browser.version(), route, width, theme, reducedMotion: 'reduce' }
            try {
              const navigation = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
              assert.equal(navigation.status(), 200)
              await page.locator('h1').waitFor({ state: 'visible' })
              await page.waitForFunction(value => document.documentElement.dataset.theme === value, theme)
              const dismiss = page.getByRole('button', { name: 'Cerrar preferencias sin cambiar la elección' })
              if (await dismiss.isVisible()) await dismiss.click()
              await page.evaluate(async () => {
                await document.fonts.ready
                for (let step = 0; step < 80; step++) {
                  const position = Math.min(step * innerHeight * .8, document.documentElement.scrollHeight - innerHeight)
                  scrollTo({ top: position, behavior: 'instant' })
                  await new Promise(resolve => setTimeout(resolve, 70))
                  if (position >= document.documentElement.scrollHeight - innerHeight - 1) break
                }
                const images = [...document.querySelectorAll('main img')]
                await Promise.all(images.map(image => Promise.race([image.decode().catch(() => undefined), new Promise(resolve => setTimeout(resolve, 8000))])))
                scrollTo({ top: 0, behavior: 'instant' })
                await new Promise(requestAnimationFrame)
              })
              const metrics = await page.evaluate(() => {
                const bounds = element => {
                  const rect = element.getBoundingClientRect()
                  return { width: rect.width, height: rect.height, left: rect.left, right: rect.right, top: rect.top + scrollY }
                }
                const h1 = document.querySelector('h1')
                const heading = { ...bounds(h1), text: h1.textContent.trim(), fontSize: getComputedStyle(h1).fontSize, lineHeight: getComputedStyle(h1).lineHeight, scrollWidth: h1.scrollWidth, clientWidth: h1.clientWidth }
                const images = [...document.querySelectorAll('main img')].filter(image => image.getClientRects().length && !image.closest('[aria-hidden="true"]')).map((image, index) => {
                  const current = new URL(image.currentSrc || image.src, location.href)
                  return { index, source: current.searchParams.get('url') || current.pathname, alt: image.alt, ...bounds(image), naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, fit: getComputedStyle(image).objectFit }
                })
                return { documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth, heading, images }
              })
              assert.ok(metrics.documentWidth <= width + 1, `Document overflow ${metrics.documentWidth} > ${width}`)
              assert.ok(metrics.heading.left >= -1 && metrics.heading.right <= width + 1, `Heading outside viewport: ${JSON.stringify(metrics.heading)}`)
              assert.ok(metrics.heading.scrollWidth <= metrics.heading.clientWidth + 1, `Heading clips text: ${JSON.stringify(metrics.heading)}`)
              const brokenImages = metrics.images.filter(image => !image.naturalWidth || !image.naturalHeight)
              assert.deepEqual(brokenImages, [], 'Visible images must decode successfully')
              assert.equal(runtimeErrors.length, 0, runtimeErrors.join('\n'))
              const slug = route.split('/').filter(Boolean).at(-1)
              if (width === 390 && theme === 'dark') await page.screenshot({ path: `${output}/${engineName}-${slug}-${width}-${theme}-heading.png`, animations: 'disabled' })
              if (width === 1366 && theme === 'light') {
                const evidence = page.locator('.rd-project-evidence').first()
                if (await evidence.count()) {
                  await evidence.scrollIntoViewIfNeeded()
                  await page.screenshot({ path: `${output}/${engineName}-${slug}-${width}-${theme}-evidence.png`, animations: 'disabled' })
                }
              }
              report.profiles.push({ ...profile, status: 'PASS', metrics })
              console.log(`PASS ${engineName} ${width} ${theme} ${route}: h1 ${metrics.heading.width.toFixed(2)} × ${metrics.heading.height.toFixed(2)}, ${metrics.images.length} images`)
            } catch (error) {
              report.profiles.push({ ...profile, status: 'FAIL', error: error.message, runtimeErrors })
              report.failures.push(`${engineName} ${width} ${theme} ${route}: ${error.message}`)
              console.error(`FAIL ${report.failures.at(-1)}`)
            }
            await writeFile(`${output}/${selected}-results.json`, JSON.stringify(report, null, 2))
          }
        } finally { await context.close() }
      }
    } finally { await browser.close() }
  }
  if (engines.length === 2) {
    for (const left of report.profiles.filter(profile => profile.engine === 'chromium' && profile.status === 'PASS')) {
      const right = report.profiles.find(profile => profile.engine === 'firefox' && profile.status === 'PASS' && profile.route === left.route && profile.width === left.width && profile.theme === left.theme)
      if (!right) continue
      const differences = []
      for (const dimension of ['width', 'height']) {
        const delta = Math.abs(left.metrics.heading[dimension] - right.metrics.heading[dimension])
        if (delta > 2) differences.push({ component: 'h1', dimension, chromium: left.metrics.heading[dimension], firefox: right.metrics.heading[dimension], delta })
      }
      for (const image of left.metrics.images) {
        const matching = right.metrics.images.find(other => other.index === image.index && other.source === image.source)
        if (!matching) { differences.push({ component: 'image', source: image.source, issue: 'Different visible image inventory' }); continue }
        for (const dimension of ['width', 'height']) {
          const delta = Math.abs(image[dimension] - matching[dimension])
          if (delta > Math.max(2, image[dimension] * .015)) differences.push({ component: 'image', source: image.source, dimension, chromium: image[dimension], firefox: matching[dimension], delta })
        }
      }
      report.comparisons.push({ route: left.route, width: left.width, theme: left.theme, differences })
    }
  }
} finally { await writeFile(`${output}/${selected}-results.json`, JSON.stringify(report, null, 2)) }
console.log(JSON.stringify({ profiles: report.profiles.length, failures: report.failures, comparisons: report.comparisons.length, candidatesForReview: report.comparisons.filter(item => item.differences.length).length }))
if (report.failures.length) process.exitCode = 1
