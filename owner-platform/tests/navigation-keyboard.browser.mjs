import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = 'http://127.0.0.1:3013'
const { OWNER_QA_EMAIL: email, OWNER_QA_PASSWORD: password } = process.env
if (!email?.endsWith('@example.invalid') || !password) throw new Error('Use an isolated synthetic QA owner')
const browser = await chromium.launch({ headless: true })
try {
  for (const width of [320, 390, 768]) for (const colorScheme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme, reducedMotion: 'reduce' })
    assert.equal((await context.request.post(`${base}/api/users/login`, { data: { email, password }, timeout: 120_000 })).status(), 200)
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`${base}/admin/collections/pages`, { waitUntil: 'networkidle', timeout: 120_000 })
    const opener = page.locator('.app-header__mobile-nav-toggler')
    const focused = target => target.evaluate(el => el === document.activeElement)
    // No locator.focus(): the real tab order must expose the menu.
    for (let i = 0; i < 12 && !await focused(opener); i++) await page.keyboard.press('Tab')
    assert.equal(await focused(opener), true, 'Mobile menu must be reachable using Tab alone')
    assert.equal(await opener.getAttribute('aria-expanded'), 'false')
    await page.keyboard.press('Enter')
    const nav = page.getByRole('dialog', { name: 'Navegación principal' })
    await nav.waitFor()
    const close = nav.getByRole('button', { name: 'Cerrar menú', exact: true })
    await page.waitForFunction(() => document.activeElement?.classList.contains('nav__mobile-close'))
    assert.equal(await nav.getAttribute('aria-modal'), 'true')
    assert.equal(await page.locator('.template-default__wrap').evaluate(el => el.inert), true)
    await page.keyboard.press('Tab')
    assert.equal(await focused(close), false, 'Tab must enter menu links, not remain stuck on close')
    await page.keyboard.press('Shift+Tab')
    assert.equal(await focused(close), true, 'Reverse Tab must wrap within the mobile dialog')
    const controlCount = await nav.locator('a, button, input, select, textarea, [tabindex]').count()
    for (let i = 0; i < controlCount + 2; i++) {
      await page.keyboard.press('Tab')
      assert.equal(await nav.evaluate(el => el.contains(document.activeElement)), true, 'Tab must not reach the hidden editor')
    }
    await page.keyboard.press('Escape')
    await page.waitForFunction(() => document.querySelector('aside.nav')?.hasAttribute('inert'))
    assert.equal(await focused(opener), true, 'Escape must return focus to the menu opener')
    assert.equal(await opener.getAttribute('aria-expanded'), 'false')
    assert.equal(await page.locator('.template-default__wrap').evaluate(el => el.inert), false)
    await page.keyboard.press('Space')
    await close.waitFor()
    await page.waitForFunction(() => document.activeElement?.classList.contains('nav__mobile-close'))
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.querySelector('aside.nav')?.hasAttribute('inert'))
    assert.equal(await focused(opener), true, 'Close button must restore focus too')
    await page.keyboard.press('Enter')
    await nav.waitFor()
    // Payload renders the current collection as non-link text; choose a destination.
    const articles = nav.locator('#nav-articles')
    for (let i = 0; i < controlCount + 2 && !await focused(articles); i++) await page.keyboard.press('Tab')
    assert.equal(await focused(articles), true, 'Another collection must be naturally reachable')
    await page.keyboard.press('Enter')
    await page.waitForURL(`${base}/admin/collections/articles`)
    await page.waitForFunction(() => document.querySelector('aside.nav')?.hasAttribute('inert'))
    assert.equal(await focused(opener), true, 'Navigation must restore focus to a visible control')
    await page.keyboard.press('Enter')
    await nav.waitFor()
    // Resize an open dialog: no stale inert or modal semantics on desktop.
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.waitForFunction(() => !document.querySelector('.template-default__wrap')?.inert && !document.querySelector('aside.nav')?.hasAttribute('aria-modal'))
    assert.equal(await page.locator('.template-default__nav-toggler').evaluate(el => el === document.activeElement), true, 'Resize must move focus to the visible desktop menu control')
    assert.equal(await page.getByRole('link', { name: 'Cuenta', exact: true }).isVisible(), true)
    await page.setViewportSize({ width, height: 900 })
    await page.waitForFunction(() => document.querySelector('aside.nav')?.hasAttribute('inert'))
    assert.equal(await opener.getAttribute('tabindex'), '0')
    assert.equal(await focused(opener), true, 'Resize back must not leave focus on a hidden desktop control')
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
    assert.deepEqual(errors, [])
    console.log(`PASS keyboard-only mobile navigation ${width}px ${colorScheme}: entry, trap, Escape, close, resize`)
    await context.close()
  }
} finally { await browser.close() }
