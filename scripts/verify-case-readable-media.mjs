import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.env.PUBLIC_TEST_URL || 'http://127.0.0.1:3102'
const output = process.env.PUBLIC_TEST_OUTPUT || '.audit/case-readable-media'
const widths = [320, 390, 768, 1024, 1366, 1440]
const slugs = ['buy-sell-marketplace', 'laliga-club-operations-hub', 'coordination-hub', 'the-ux-union', 'nude-project']
const report = { base, checks: [], failures: [], errors: [] }
await fs.mkdir(output, { recursive: true })
const browser = await chromium.launch()
try {
  for (const width of widths) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' })
    page.on('pageerror', error => report.errors.push({ width, message: String(error) }))
    for (const slug of slugs) {
      try {
        const response = await page.goto(base + '/proyectos/' + slug, { waitUntil: 'networkidle' })
        assert.equal(response?.status(), 200, slug)
        const consent = page.getByRole('button', { name: 'Cerrar preferencias sin cambiar la elección' })
        if (await consent.isVisible()) await consent.click()
        const images = page.locator('.rd-project-evidence img')
        assert(await images.count() > 0, 'Missing project evidence')
        const measures = []
        for (let i = 0; i < await images.count(); i++) {
          const image = images.nth(i)
          await image.scrollIntoViewIfNeeded()
          await image.evaluate(element => element.decode())
          const measure = await image.evaluate(element => {
            const rect = element.getBoundingClientRect()
            const link = element.closest('a')
            const host = element.closest('.rd-case-phase, .rd-visual-journey__slide')
            const hostStyle = host && getComputedStyle(host)
            const frame = link.parentElement.getBoundingClientRect()
            const hint = link.querySelector('.rd-project-evidence__hint').getBoundingClientRect()
            const intrinsicWidth = Number(element.getAttribute('width'))
            const intrinsicHeight = Number(element.getAttribute('height'))
            return {
              source: link.getAttribute('href'), x: rect.x, width: rect.width, height: rect.height,
              ratio: intrinsicWidth / intrinsicHeight, naturalWidth: element.naturalWidth,
              portrait: link.dataset.portrait === 'true', frameWidth: frame.width,
              fullAvailable: host ? host.clientWidth - parseFloat(hostStyle.paddingLeft) - parseFloat(hostStyle.paddingRight) : null,
              hintWidth: hint.width, hintHeight: hint.height,
              scrollWidth: document.documentElement.scrollWidth,
            }
          })
          const label = slug + ' ' + width + 'px image ' + i + ' ' + JSON.stringify(measure)
          assert(measure.width > 0 && measure.naturalWidth > 0, label)
          assert(measure.x >= -1 && measure.x + measure.width <= width + 1, 'Image bounds: ' + label)
          assert(measure.scrollWidth <= width + 1, 'Document overflow: ' + label)
          assert(Math.abs(measure.width / measure.height - measure.ratio) < .015, 'Distorted image: ' + label)
          assert(measure.hintWidth >= 44 && measure.hintHeight >= 44, 'Small enlargement control: ' + label)
          assert(measure.source.startsWith('/projects/'), 'Missing original: ' + label)
          if (measure.portrait) {
            assert(measure.width >= Math.min(230, width - 64), 'Tiny mobile evidence: ' + label)
            assert(measure.width <= 368.5 && measure.height <= 739, 'Oversized device: ' + label)
          } else {
            assert(measure.width >= Math.min(measure.frameWidth * .95, 1400), 'Unused image width: ' + label)
            if (measure.ratio >= 1.1 && measure.fullAvailable) {
              assert(measure.width >= Math.min(measure.fullAvailable * .95, 1400), 'Landscape screenshot in narrow column: ' + label)
            }
          }
          measures.push(measure)
        }
        const diagrams = await page.locator('.rd-visual-journey .rd-coordination-diagram, .rd-case-phase .rd-coordination-diagram').evaluateAll(elements =>
          elements.map(element => {
            const rect = element.getBoundingClientRect()
            return { width: rect.width, height: rect.height, x: rect.x,
              columns: getComputedStyle(element).gridTemplateColumns.split(' ').length,
              agentsHeight: element.querySelector('.rd-coordination-agents').getBoundingClientRect().height,
              clipped: element.scrollWidth > element.clientWidth + 1 }
          }))
        for (const diagram of diagrams) {
          assert.equal(diagram.columns, 1, 'Diagram inherited editorial columns')
          assert(diagram.height < 650 && diagram.agentsHeight < 180 && !diagram.clipped, JSON.stringify(diagram))
          assert(diagram.x >= -1 && diagram.x + diagram.width <= width + 1, JSON.stringify(diagram))
        }
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'HTML bounds')
        if (await images.count()) {
          const link = page.locator('.rd-project-evidence').first()
          await page.keyboard.press('Tab')
          await link.focus()
          assert(await link.evaluate(element => element.matches(':focus-visible')), 'Enlargement keyboard focus')
          if (width === 390) {
            const original = await link.getAttribute('href')
            const popupPromise = page.waitForEvent('popup')
            await link.press('Enter')
            const popup = await popupPromise
            await popup.waitForLoadState('domcontentloaded')
            assert.equal(new URL(popup.url()).pathname, original, 'Keyboard opens original')
            await popup.close()
          }
        }
        if (width === 390 || width === 1440) {
          const target = slug === 'buy-sell-marketplace'
            ? page.locator('#fase-prototipo').first()
            : slug === 'coordination-hub'
              ? page.locator('.rd-visual-journey__slide').first()
              : page.locator('.rd-project-evidence[data-portrait="true"]').last()
          if (await target.count()) {
            await target.scrollIntoViewIfNeeded()
            await page.screenshot({ path: output + '/' + slug + '-' + width + '.png' })
          }
        }
        report.checks.push({ slug, width, images: measures, diagrams })
        console.log('PASS', slug, width)
      } catch (error) {
        report.failures.push({ slug, width, error: String(error.stack ?? error) })
        await page.screenshot({ path: output + '/failure-' + slug + '-' + width + '.png' }).catch(() => {})
        console.error('FAIL', slug, width, String(error))
      }
    }
    await page.close()
  }
} finally {
  await browser.close()
  report.result = report.failures.length || report.errors.length ? 'FAIL' : 'PASS'
  await fs.writeFile(output + '/results.json', JSON.stringify(report, null, 2))
}
console.log(JSON.stringify({ result: report.result, passed: report.checks.length, failed: report.failures.length, errors: report.errors.length }))
if (report.result !== 'PASS') process.exitCode = 1
