import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { chromium } from 'playwright'

// Deliberately fixed to an isolated QA server, never the owner's normal port.
const base = 'http://127.0.0.1:3013'
const { OWNER_QA_EMAIL: email, OWNER_QA_PASSWORD: password } = process.env
if (!email?.endsWith('@example.invalid') || !password) throw new Error('Use an isolated synthetic QA owner')
const browser = await chromium.launch({ headless: true })
try {
  for (const width of [320, 390, 768, 1024, 1280, 1680]) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width <= 768, colorScheme: theme, reducedMotion: theme === 'light' ? 'reduce' : 'no-preference' })
    const login = await context.request.post(`${base}/api/users/login`, { data: { email, password } })
    assert.equal(login.status(), 200)
    const created = await context.request.post(`${base}/api/pages?draft=true`, { data: {
      title: 'QA camino editorial largo para comprobar navegación y cuenta sin desbordamientos',
      slug: `qa-shell-${randomUUID()}`, layout: [{ blockType: 'hero', heading: 'QA shell' }],
    } })
    assert.equal(created.status(), 201)
    const id = (await created.json()).doc.id
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/admin/collections/pages/${id}`, { waitUntil: 'networkidle', timeout: 120_000 })
    await page.locator('form[data-form-ready="true"]').first().waitFor()
    assert.equal(await page.locator('html').getAttribute('data-theme'), theme, 'Payload must resolve the requested theme')
    const geometry = await page.evaluate(() => ({
      viewport: innerWidth, scroll: document.documentElement.scrollWidth,
      overflow: Array.from(document.querySelectorAll('body *')).filter(el => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.right > innerWidth + 1 && getComputedStyle(el).visibility !== 'hidden'
      }).slice(0, 15).map(el => ({ tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right })),
    }))
    if (geometry.scroll > width) console.log(JSON.stringify({ width, geometry }))
    assert.ok(geometry.scroll <= width, `Closed navigation must not expand document: ${geometry.scroll} > ${width}`)
    const account = page.getByRole('link', { name: 'Cuenta', exact: true })
    const accountBox = await account.boundingBox()
    assert.ok(accountBox && accountBox.x >= 0 && accountBox.x + accountBox.width <= width, 'Account remains visible')
    const breadcrumbs = page.locator('.app-header__step-nav-wrapper')
    const collectionLink = breadcrumbs.getByRole('link', { name: 'Páginas', exact: true })
    await collectionLink.focus()
    await page.keyboard.press('Tab')
    assert.equal(await account.evaluate(el => el === document.activeElement), true, 'Account follows breadcrumbs in keyboard order')
    // Payload hides the closed sidebar with inert; its links must not receive focus.
    const nav = page.locator('aside.nav')
    const open = page.getByRole('button', { name: /Abrir Menú/i }).filter({ visible: true }).first()
    if (await open.count()) {
      assert.equal(await nav.getAttribute('inert'), '')
      if (width <= 768) await open.tap()
      else await open.click()
    }
    await page.waitForFunction(() => {
      const nav = document.querySelector('aside.nav')
      return nav && !nav.hasAttribute('inert') && Number(getComputedStyle(nav).opacity) === 1
    })
    const openGeometry = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, nav: document.querySelector('aside.nav').getBoundingClientRect().toJSON(), wrap: document.querySelector('.template-default__wrap').getBoundingClientRect().toJSON() }))
    if (openGeometry.scroll > width) {
      console.log(JSON.stringify({ openGeometry }))
      await page.screenshot({ path: '../.audit/cms-shell-open-failure.png' })
    }
    assert.ok(openGeometry.scroll <= width, 'Open navigation must fit')
    if (width <= 768) {
      assert.ok(openGeometry.wrap.width >= width - 1, 'Opening the mobile menu must not compress the editor')
      const close = nav.locator('.nav__mobile-close')
      await close.focus()
      await page.keyboard.press('Space')
      await page.waitForFunction(() => document.querySelector('aside.nav')?.hasAttribute('inert'))
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Closing the menu restores a fitting editor')
      await page.screenshot({ path: `../.audit/cms-editor-${width}-${theme}.png` })
      await open.tap()
    }
    const pages = nav.locator('a#nav-pages')
    await pages.focus()
    const linkBox = await pages.boundingBox()
    assert.ok(linkBox && linkBox.x >= 0 && linkBox.x + linkBox.width <= width, 'Menu link stays reachable')
    await page.keyboard.press('Enter')
    await page.waitForURL(`${base}/admin/collections/pages`)
    if (width <= 768) assert.equal(await nav.getAttribute('inert'), '', 'Mobile navigation closes after route change')
    await page.goto(`${base}/admin/content-preview/pages/${id}`, { waitUntil: 'networkidle' })
    await page.getByRole('heading', { name: 'QA shell', exact: true }).waitFor()
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Private preview fits the viewport')
    await page.screenshot({ path: `../.audit/cms-shell-${width}-${theme}.png` })
    assert.deepEqual(errors, [])
    console.log(`PASS real owner shell/editor/preview ${width}px ${theme}`)
    await context.close()
  }
} finally { await browser.close() }
