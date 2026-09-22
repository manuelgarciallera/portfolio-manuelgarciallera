// Checks 15 sitemap pages plus the separate privacy page; uses an existing server.
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const base = (process.env.PUBLIC_TEST_URL || 'http://127.0.0.1:3102').replace(/\/$/, '')
const out = path.resolve(process.env.PUBLIC_TEST_OUTPUT || '.audit/project-images-20260922/routes-final')
await fs.mkdir(out, { recursive: true })
const projectSlugs = ['buy-sell-marketplace', 'laliga-club-operations-hub', 'coordination-hub', 'the-ux-union', 'nude-project']
const articleSlugs = ['del-objeto-a-la-interfaz', 'sistemas-de-diseno-de-figma-a-codigo', 'colaboracion-humano-ia-con-autoria', 'interfaces-para-roles-y-estados-complejos']
const canonicalPaths = ['/', '/proyectos', '/investigacion', '/sobre-mi', '/proceso', '/blog', ...projectSlugs.map(slug => `/proyectos/${slug}`), ...articleSlugs.map(slug => `/blog/${slug}`)]
const aliases = [['/casos', '/proyectos'], ['/articulos', '/blog'], ...projectSlugs.map(slug => [`/casos/${slug}`, `/proyectos/${slug}`]), ...articleSlugs.map(slug => [`/articulos/${slug}`, `/blog/${slug}`])]
const selection = process.env.PUBLIC_TEST_ONLY === 'browser' ? 'browser' : 'all'
const report = { base, selection, startedAt: new Date().toISOString(), checks: [], warnings: [], failures: [], pageErrors: [] }
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', locale: 'en-GB' })
await context.route('**/*', route => {
  const url = route.request().url()
  return url.startsWith(base + '/') || url.startsWith('data:') || url.startsWith('blob:') ? route.continue() : route.abort()
})
const parser = await context.newPage()
let browserPage
const check = async (name, fn) => {
  if (selection === 'browser' && !/^(browser |existing home fragment |no runtime )/.test(name)) return
  try {
    const evidence = await fn()
    report.checks.push({ name, evidence })
    console.log(`PASS ${name}`)
  } catch (error) {
    const failure = { name, error: String(error), stack: error.stack }
    if (browserPage && !browserPage.isClosed()) {
      failure.browser = await browserPage.evaluate(() => ({
        url: location.href, scrollY, readyState: document.readyState,
        anchors: ['casos', 'articulos', 'contacto', 'fase-desarrollo', 'main-content'].map(id => {
          const element = document.getElementById(id)
          const rect = element?.getBoundingClientRect()
          return { id, top: rect?.top, bottom: rect?.bottom }
        }),
      })).catch(() => null)
      failure.screenshot = `routes-failure-${report.failures.length + 1}.png`
      await browserPage.screenshot({ path: path.join(out, failure.screenshot) }).catch(() => {})
    }
    report.failures.push(failure)
    console.log(`FAIL ${name}: ${error.message}`)
  }
}
const request = async pathname => {
  const response = await fetch(new URL(pathname, base), { redirect: 'manual' })
  return { response, text: await response.text() }
}
const parse = html => parser.evaluate(source => {
  const doc = new DOMParser().parseFromString(source, 'text/html')
  return {
    lang: doc.documentElement.lang,
    title: doc.title,
    canonicals: [...doc.querySelectorAll('link[rel="canonical"]')].map(link => link.getAttribute('href')),
    og: [...doc.querySelectorAll('meta[property="og:url"]')].map(meta => meta.getAttribute('content')),
    hreflang: [...doc.querySelectorAll('link[rel="alternate"][hreflang]')].map(link => ({ lang: link.hreflang, href: link.getAttribute('href') })),
    jsonLd: [...doc.querySelectorAll('script[type="application/ld+json"]')].map(script => JSON.parse(script.textContent)),
    h1: doc.querySelectorAll('h1').length,
    staleLinks: [...doc.querySelectorAll('a[href]')].map(link => link.getAttribute('href')).filter(href => /^\/(casos|articulos)(\/|[?#]|$)/.test(href)),
  }
}, html)

try {
  await check('sitemap: 15 canonical pages and no fictitious language alternates', async () => {
    const { response, text } = await request('/sitemap.xml')
    assert.equal(response.status, 200)
    const urls = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
    assert.deepEqual(urls.map(url => new URL(url).pathname).sort(), [...canonicalPaths].sort())
    assert.equal(/hreflang=/.test(text), false)
    return { status: response.status, urls }
  })
  for (const pathname of canonicalPaths) {
    await check(`HTTP and initial SEO ${pathname}`, async () => {
      const { response, text } = await request(pathname)
      assert.equal(response.status, 200)
      const parsed = await parse(text)
      assert.equal(parsed.canonicals.length, 1)
      assert.equal(new URL(parsed.canonicals[0]).pathname, pathname)
      assert.equal(parsed.og.length, 1)
      assert.equal(new URL(parsed.og[0]).pathname, pathname)
      assert.equal(parsed.lang, 'es')
      assert.equal(parsed.hreflang.length, 0)
      assert.equal(parsed.h1, 1)
      assert.deepEqual(parsed.staleLinks, [])
      assert(parsed.jsonLd.some(item => item['@type'] === 'WebSite' && item.inLanguage === 'es'))
      if (pathname.startsWith('/proyectos/')) {
        const item = parsed.jsonLd.find(item => item['@type'] === 'CreativeWork')
        assert(item)
        assert.equal(new URL(item.url).pathname, pathname)
      }
      if (pathname.startsWith('/blog/')) {
        const item = parsed.jsonLd.find(item => item['@type'] === 'Article')
        assert(item)
        assert.equal(new URL(item.mainEntityOfPage).pathname, pathname)
        assert.equal(item.inLanguage, 'es')
      }
      if (pathname === '/sobre-mi') assert.equal(new URL(parsed.jsonLd.find(item => item['@type'] === 'ProfilePage').url).pathname, pathname)
      return { status: response.status, ...parsed }
    })
  }
  for (const [oldPath, newPath] of aliases) {
    await check(`single 308 with query ${oldPath}`, async () => {
      const { response } = await request(`${oldPath}?utm_source=route-audit&ref=es%20ES`)
      assert.equal(response.status, 308)
      const location = response.headers.get('location')
      const target = new URL(location, base)
      assert.equal(target.origin, base)
      assert.equal(target.pathname, newPath)
      assert.equal(target.searchParams.get('utm_source'), 'route-audit')
      assert.equal(target.searchParams.get('ref'), 'es ES')
      const final = await fetch(target, { redirect: 'manual' })
      assert.equal(final.status, 200)
      await final.arrayBuffer()
      return { status: response.status, location, finalStatus: final.status }
    })
  }
  for (const pathname of ['/proyectos/unknown-project', '/proyectos/fintech-app', '/proyectos/estadio-3d', '/blog/unknown-article', '/en', '/en/projects', '/admin', '/api/users']) {
    await check(`not published: ${pathname}`, async () => {
      const { response } = await request(pathname)
      assert.equal(response.status, 404)
      return { status: response.status }
    })
  }
  await check('privacy keeps its Spanish canonical URL', async () => {
    const { response, text } = await request('/privacidad')
    assert.equal(response.status, 200)
    const parsed = await parse(text)
    assert.equal(new URL(parsed.canonicals[0]).pathname, '/privacidad')
    assert.equal(parsed.lang, 'es')
    assert.equal(parsed.hreflang.length, 0)
    assert.equal(new URL(parsed.og[0]).pathname, '/privacidad')
    return { status: response.status, ...parsed }
  })
  const page = await context.newPage()
  browserPage = page
  page.on('pageerror', error => report.pageErrors.push(String(error)))
  for (const item of [
    { from: '/casos/buy-sell-marketplace?from=legacy#fase-desarrollo', to: '/proyectos/buy-sell-marketplace', anchor: 'fase-desarrollo', label: 'Proyectos', image: 'routes-legacy-project-fragment.png' },
    { from: '/articulos/del-objeto-a-la-interfaz?from=legacy#main-content', to: '/blog/del-objeto-a-la-interfaz', anchor: 'main-content', label: 'Blog', image: 'routes-legacy-article-fragment.png' },
  ]) {
    await check(`browser preserves query and fragment ${item.from}`, async () => {
      const response = await page.goto(base + item.from, { waitUntil: 'networkidle' })
      assert.equal(response.status(), 200)
      const url = new URL(page.url())
      assert.equal(url.pathname, item.to)
      assert.equal(url.search, '?from=legacy')
      assert.equal(url.hash, `#${item.anchor}`)
      await page.waitForFunction(id => { const e = document.getElementById(id); return e && e.getBoundingClientRect().top < innerHeight && e.getBoundingClientRect().bottom > 0 }, item.anchor)
      assert.equal(await page.locator('nav[aria-label="Principal"] a[aria-current="page"]').innerText(), item.label)
      assert.equal(await page.locator('html').getAttribute('lang'), 'es')
      await page.screenshot({ path: path.join(out, item.image) })
      return { url: page.url(), status: response.status(), visibleAnchor: item.anchor, browserLocale: 'en-GB', screenshot: item.image }
    })
  }
  for (const anchor of ['casos', 'articulos', 'contacto']) {
    await check(`existing home fragment #${anchor}`, async () => {
      await page.goto(`${base}/#${anchor}`, { waitUntil: 'networkidle' })
      await page.waitForFunction(id => { const e = document.getElementById(id); return e && e.getBoundingClientRect().top < innerHeight && e.getBoundingClientRect().bottom > 0 }, anchor)
      return { url: page.url(), visibleAnchor: anchor }
    })
  }
  await check('browser back and forward retain canonical page, query and fragment', async () => {
    await page.goto(base + '/#casos', { waitUntil: 'networkidle' })
    await page.goto(base + '/casos/buy-sell-marketplace?from=history#fase-desarrollo', { waitUntil: 'networkidle' })
    await page.goBack({ waitUntil: 'domcontentloaded' })
    await page.waitForURL(base + '/#casos')
    assert.equal(page.url(), base + '/#casos')
    await page.goForward({ waitUntil: 'domcontentloaded' })
    await page.waitForURL(base + '/proyectos/buy-sell-marketplace?from=history#fase-desarrollo')
    assert.equal(page.url(), base + '/proyectos/buy-sell-marketplace?from=history#fase-desarrollo')
    return { final: page.url() }
  })
  await check('no runtime page errors in the navigation check', async () => {
    assert.deepEqual(report.pageErrors, [])
    return { count: report.pageErrors.length }
  })
} finally {
  report.finishedAt = new Date().toISOString()
  await browser.close()
  await fs.writeFile(path.join(out, 'canonical-routes-http-browser.json'), JSON.stringify(report, null, 2))
}
console.log(JSON.stringify({ passed: report.checks.length, failed: report.failures.length, warnings: report.warnings, report: path.join(out, 'canonical-routes-http-browser.json') }))
if (report.failures.length) process.exitCode = 1
