import { build } from 'esbuild'
import { chromium } from 'playwright'
import { createServer } from 'node:http'
import { mkdir } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import assert from 'node:assert/strict'

// Isolated, synthetic-provider test. Never mounts or modifies the public application.
const result = await build({
  stdin: { contents: `
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    import { AnalyticsConsentCard } from './src/components/analytics/consent/AnalyticsConsentCard';
    import { createController } from './src/lib/analytics-consent/controller';
    import { CONSENT_KEY } from './src/lib/analytics-consent/policy';
    import { attachConsentLifecycle } from './src/lib/analytics-consent/lifecycle';
    const adapter = name => ({
      start() { fetch('/sdk/' + name); },
      stop() { window.stopped.push(name); },
      page(path) { window.views.push([name, path]); }
    });
    window.stopped = []; window.views = [];
    const controller = createController({
      storage: { read: () => localStorage.getItem(CONSENT_KEY), write: value => localStorage.setItem(CONSENT_KEY, value) },
      now: () => Date.now(), environment: () => ({ canonical: true, privacy: window.testPrivacy === true }),
      allowedPaths: new Set(['/']), adapters: { google: adapter('google'), umami: adapter('umami') }
    });
    controller.visit('/');
    attachConsentLifecycle(controller, window, document);
    createRoot(document.getElementById('root')).render(<AnalyticsConsentCard controller={controller} />);
  `, resolveDir: process.cwd(), loader: 'tsx' },
  bundle: true, write: false, outdir: 'out', minify: true, define: { 'process.env.NODE_ENV': '"production"' },
})
const js = result.outputFiles.find(f => f.path.endsWith('.js')).text
const css = result.outputFiles.find(f => f.path.endsWith('.css'))?.text || ''
const server = createServer((req, res) => {
  if (req.url === '/app.js') { res.setHeader('content-type', 'text/javascript'); res.end(js); return }
  if (req.url === '/app.css') { res.setHeader('content-type', 'text/css'); res.end(css); return }
  if (req.url.startsWith('/sdk/')) { res.end('synthetic'); return }
  res.setHeader('content-type', 'text/html; charset=utf-8')
  res.end(`<!doctype html><html lang="es" data-theme="dark"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ensayo de consentimiento · proveedores simulados</title><link rel="stylesheet" href="/app.css"><style>body{margin:0;background:#0a0a0a;color:#f5f5f7;font:16px system-ui}main{min-height:90vh;padding:24px}a{color:inherit}h1{max-width:22ch}</style><main><h1>Portfolio — ensayo aislado</h1><p>No es la web publicada.</p><a href="#contacto">Contacto</a><label id="contacto">Mensaje <input name="draft"></label></main><div id="root"></div><script src="/app.js"></script></html>`)
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const url = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch({ headless: true })
const output = '.audit/analytics-consent-2026-09-16'
await mkdir(output, { recursive: true })
try {
  for (const width of [320, 390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()
    const scripts = [], errors = []
    page.on('request', req => { if (req.url().includes('/sdk/')) scripts.push(req.url().split('/').at(-1)) })
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(url)
    page.setDefaultTimeout(5000)
    const accept = page.getByRole('button', { name: 'Aceptar analítica', exact: true })
    const reject = page.getByRole('button', { name: 'Rechazar analítica', exact: true })
    await accept.waitFor({ timeout: 5000 })
    assert.deepEqual(scripts, [], 'no SDK before consent')
    const banner = page.getByRole('region', { name: 'Tu privacidad, tu elección' })
    const initialBox = await banner.boundingBox()
    assert.ok(initialBox.height <= (width >= 1024 ? 140 : 290), 'compact initial banner')
    await page.screenshot({ path: `${output}/compact-${width}.png` })
    await page.getByRole('heading', { name: 'Portfolio — ensayo aislado' }).click()
    await accept.waitFor({ state: 'hidden' })
    assert.deepEqual(scripts, [], 'outside click never grants consent')
    assert.equal(await page.evaluate(() => localStorage.getItem('portfolio-analytics-consent-v1')), null)
    await page.getByRole('button', { name: 'Preferencias de analítica', exact: true }).click()
    await accept.waitFor()
    for (const button of [accept, reject]) {
      const box = await button.boundingBox(); assert.ok(box.height >= 44)
    }
    const style = locator => locator.evaluate(el => {
      const s = getComputedStyle(el); return [s.backgroundColor, s.color, s.border, s.fontWeight]
    })
    assert.deepEqual(await style(accept), await style(reject), 'equal visual prominence')
    await page.getByText('Detalles y preferencias', { exact: true }).click()
    assert.equal(await page.getByRole('checkbox', { name: 'Google Analytics', exact: true }).isChecked(), false)
    assert.equal(await page.getByRole('checkbox', { name: 'Umami', exact: true }).isChecked(), false)
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    await page.screenshot({ path: `${output}/details-${width}.png` })
    await page.getByRole('checkbox', { name: 'Umami', exact: true }).check()
    await page.getByRole('button', { name: 'Guardar selección', exact: true }).click()
    await page.waitForFunction(() => window.views.length === 1)
    assert.deepEqual(scripts, ['umami'])
    await page.getByRole('button', { name: 'Preferencias de analítica', exact: true }).click()
    await page.waitForFunction(() => document.activeElement?.tagName === 'H2')
    await reject.click()
    assert.deepEqual(await page.evaluate(() => window.stopped), ['umami'])
    await page.reload()
    assert.equal(await accept.count(), 0, 'rejection persists')
    await page.getByRole('button', { name: 'Preferencias de analítica', exact: true }).click()
    await page.getByRole('button', { name: 'Cerrar preferencias sin cambiar la elección' }).click()
    assert.equal(await page.getByRole('button', { name: 'Preferencias de analítica', exact: true }).evaluate(el => el === document.activeElement), true)
    assert.deepEqual(scripts, ['umami'], 'closing does not accept')
    const peer = await context.newPage()
    await peer.goto(url)
    await peer.evaluate(() => localStorage.removeItem('portfolio-analytics-consent-v1'))
    await accept.waitFor()
    await peer.close()
    await page.evaluate(() => document.documentElement.dataset.theme = 'light')
    await page.screenshot({ path: `${output}/light-${width}.png` })
    await accept.click()
    await page.waitForFunction(() => window.views.length === 2)
    assert.deepEqual(scripts, ['umami', 'google', 'umami'])
    await page.getByRole('button', { name: 'Preferencias de analítica', exact: true }).click()
    await page.waitForFunction(() => document.activeElement?.tagName === 'H2')
    await page.keyboard.press('Escape')
    await accept.waitFor({ state: 'hidden' })
    assert.equal(await accept.count(), 0)
    assert.deepEqual(errors, [])
    await context.close()
  }
  for (const scenario of ['privacy', 'storage']) {
    const context = await browser.newContext()
    await context.addInitScript(mode => {
      if (mode === 'privacy') window.testPrivacy = true
      else {
        Storage.prototype.getItem = () => { throw Error('blocked') }
        Storage.prototype.setItem = () => { throw Error('blocked') }
      }
    }, scenario)
    const page = await context.newPage(), requests = []
    page.on('request', req => { if (req.url().includes('/sdk/')) requests.push(req.url()) })
    await page.goto(url)
    if (scenario === 'privacy') {
      assert.equal(await page.getByRole('button', { name: 'Aceptar analítica', exact: true }).isDisabled(), true)
    } else {
      await page.getByRole('button', { name: 'Aceptar analítica', exact: true }).click()
      await page.getByRole('alert').waitFor()
    }
    assert.deepEqual(requests, [])
    await context.close()
  }
  console.log(JSON.stringify({ result: 'PASS', widths: [320, 390, 768, 1440], syntheticProviders: true, harnessJsGzipBytes: gzipSync(js).length, cssGzipBytes: gzipSync(css).length, screenshots: output }))
} finally {
  await browser.close()
  await new Promise(resolve => server.close(resolve))
}
