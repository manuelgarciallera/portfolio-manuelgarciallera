import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'

const base = process.env.CONSENT_TEST_URL || 'http://localhost:3015'
const output = '.audit/analytics-consent-responsive'
const cases = [
  [390, 844, 2], [720, 450, 2],
  [320, 568, 1], [360, 640, 1], [390, 844, 1], [430, 932, 1],
  [568, 320, 1], [844, 390, 1], [768, 1024, 1], [1024, 768, 1],
  [1440, 900, 1], [1920, 1080, 1],
]
await mkdir(output, { recursive: true })
const browser = await chromium.launch()
try {
  for (const [width, height, scale] of cases) {
    for (const theme of ['dark', 'light']) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 900,
        reducedMotion: 'reduce' })
      context.setDefaultTimeout(8000)
      context.setDefaultNavigationTimeout(30000)
      const page = await context.newPage(), errors = [], requests = []
      page.on('pageerror', e => errors.push(e.message))
      page.on('request', req => { if (/umami\.is|google-analytics\.com|googletagmanager\.com|\/api\/web-vitals/.test(req.url())) requests.push(req.url()) })
      await page.goto(base + '/privacidad', { waitUntil: 'domcontentloaded' })
      const card = page.getByRole('region', { name: 'Tu privacidad, tu elección' })
      await card.waitFor()
      await page.evaluate(({ theme, scale }) => {
        document.documentElement.dataset.theme = theme
        document.documentElement.style.fontSize = `${scale * 16}px`
      }, { theme, scale })
      const name = `${width}x${height}-${scale}x-${theme}`
      const overflow = await card.evaluate(el => ({ horizontal: el.scrollWidth > el.clientWidth,
        viewport: document.documentElement.scrollWidth > innerWidth,
        box: (() => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight })() }))
      assert.deepEqual(overflow, { horizontal: false, viewport: false, box: true }, name)
      const privacy = card.getByRole('link', { name: 'Privacidad y cookies' })
      // The privacy link is now inline prose (WCAG target-size inline exception).
      assert.ok(await privacy.isVisible(), `${name}: inline privacy information remains visible`)
      assert.equal(await privacy.getAttribute('href'), '/privacidad')
      for (const label of ['Aceptar analítica', 'Rechazar analítica']) {
        const box = await card.getByRole('button', { name: label, exact: true }).boundingBox()
        assert.ok(box.height >= 44 && box.width >= 44, `${name}: button touch area`)
      }
      const accept = await card.getByRole('button', { name: 'Aceptar analítica', exact: true }).boundingBox()
      const reject = await card.getByRole('button', { name: 'Rechazar analítica', exact: true }).boundingBox()
      assert.ok(Math.abs(accept.width - reject.width) < 1, `${name}: equivalent choices`)
      if (scale === 2) {
        for (const label of ['Aceptar analítica', 'Rechazar analítica']) {
          assert.ok(await card.getByRole('button', { name: label, exact: true }).evaluate(el => el.scrollWidth <= el.clientWidth), `${name}: enlarged text is not clipped`)
        }
      }
      await page.screenshot({ path: `${output}/${name}.png` })
      const summary = card.getByText('Detalles y preferencias', { exact: true })
      await summary.focus(); await page.keyboard.press('Enter')
      await page.getByRole('checkbox', { name: 'Google Analytics', exact: true }).waitFor()
      const save = card.getByRole('button', { name: 'Guardar selección', exact: true })
      await save.focus()
      const visible = await save.evaluate(el => {
        const r = el.getBoundingClientRect()
        return r.top >= 0 && r.bottom <= innerHeight && el.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2))
      })
      assert.ok(visible, `${name}: keyboard can reach save through internal scroll`)
      assert.ok(await card.evaluate(el => el.scrollWidth <= el.clientWidth), `${name}: expanded details do not overflow`)
      await page.screenshot({ path: `${output}/${name}-details.png` })
      await page.keyboard.press('Enter')
      assert.equal(await card.count(), 0)
      const reopen = page.getByRole('button', { name: 'Preferencias de analítica', exact: true })
      await reopen.click()
      await page.waitForFunction(() => document.activeElement?.tagName === 'H2')
      await page.keyboard.press('Escape')
      assert.equal(await card.count(), 0)
      assert.deepEqual(requests, [], `${name}: no analytics request`)
      assert.deepEqual(errors, [], `${name}: no page errors`)
      await context.close()
    }
  }
  console.log(`PASS ${cases.length * 2} responsive scenarios: portrait/landscape, desktop, 200% text, themes, keyboard, touch areas, zero tracking`)
} finally { await browser.close() }
