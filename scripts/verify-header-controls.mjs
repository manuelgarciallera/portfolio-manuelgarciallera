import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { chromium, firefox } from 'playwright'

const base = process.argv[2] || 'http://localhost:3040'
const engineName = process.argv[3] || 'chromium'
const reducedMotion = process.argv[4] || 'reduce'
const filter = process.argv[5] || ''
const engine = { chromium, firefox }[engineName]
assert.ok(engine, `Unknown browser: ${engineName}`)
assert.ok(existsSync(engine.executablePath()), `${engineName} is not installed; this check never installs browsers`)
assert.ok(['reduce', 'no-preference'].includes(reducedMotion))
const deployment = new URL(base).port || new URL(base).hostname
const output = `.audit/browser-parity-controls-20260923/${deployment}/${engineName}-${reducedMotion}`
await mkdir(output, { recursive: true })
const browser = await engine.launch()
const failures = []
const results = []
async function check(name, verify, { route = '/proceso', width = 1280 } = {}) {
  if (filter && !name.includes(filter)) return
  for (const theme of ['dark', 'light']) {
  const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 }, reducedMotion })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.addInitScript(value => localStorage.setItem('rd-theme', value), theme)
  try {
    // Dev HMR and unrelated image loading can keep the network busy; readiness
    // here is the rendered controls plus the state waits in each interaction.
    await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.locator('.rd-header').waitFor({ state: 'visible' })
    await page.waitForFunction(value => document.documentElement.dataset.theme === value, theme)
    await page.evaluate(() => document.fonts.ready)
    // The non-modal notice must not obscure the controls under test. Closing
    // it makes no consent choice and never submits a contact form.
    const dismiss = page.getByRole('button', { name: 'Cerrar preferencias sin cambiar la elección' })
    if (await dismiss.isVisible()) await dismiss.click()
    const observations = await verify(page)
    assert.deepEqual(errors, [], 'No browser runtime errors')
    results.push({ engine: engineName, version: browser.version(), theme, reducedMotion, width, name, status: 'PASS', observations })
    console.log(`PASS ${engineName} ${theme} ${reducedMotion}: ${name}`)
  } catch (error) {
    const state = await page.evaluate(() => ({ active: document.activeElement?.outerHTML.slice(0, 350), overflow: document.body.style.overflow, menuHidden: document.getElementById('mobile-navigation')?.getAttribute('aria-hidden') })).catch(() => null)
    failures.push(`${theme} ${name}: ${error.message}`)
    results.push({ engine: engineName, version: browser.version(), theme, reducedMotion, width, name, status: 'FAIL', error: error.message, state, stack: error.stack })
    console.error(`FAIL ${engineName} ${theme} ${reducedMotion}: ${name}: ${error.message}`)
  } finally { await page.close() }
  }
}

function contrast(foreground, background) {
  const luminance = color => {
    const components = color.match(/[\d.]+/g)
    assert.ok(components?.length >= 3, `Missing computed color: ${JSON.stringify(color)}`)
    const channels = components.slice(0, 3).map(Number).map(value => {
      const channel = value / 255
      return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4
    })
    return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722
  }
  const first = luminance(foreground), second = luminance(background)
  return (Math.max(first, second) + .05) / (Math.min(first, second) + .05)
}

try {
  await check('focused header remains visible after downward scroll', async page => {
    await page.locator('.rd-desktop-nav a').first().focus()
    await page.evaluate(() => scrollTo({ top: 600, behavior: 'instant' }))
    await page.waitForTimeout(550)
    const geometry = await page.locator('.rd-desktop-nav a').first().boundingBox()
    assert.ok(geometry.y >= 0, `focused link above viewport: ${geometry.y}`)
    assert.ok(await page.locator('.rd-desktop-nav a').first().evaluate(element => element === document.activeElement))
    await page.locator('.rd-breadcrumbs a').focus()
    await page.evaluate(() => scrollTo({ top: 900, behavior: 'instant' }))
    await page.waitForTimeout(550)
    assert.equal(await page.locator('.rd-header').evaluate(element => element.getBoundingClientRect().bottom < 0), true, 'header can hide again when focus leaves')
  })
  await check('mobile keyboard loop includes the visible close control', async page => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
    await page.waitForFunction(() => document.body.style.overflow === 'hidden', null, { timeout: 3000 })
    const first = page.locator('.rd-mobile-nav-links a').first()
    await first.focus()
    await page.keyboard.press('Shift+Tab')
    assert.equal(await page.locator('.rd-menu-btn').evaluate(element => element === document.activeElement), true, 'Shift+Tab from Inicio reaches Close')
    await page.keyboard.press('Shift+Tab')
    assert.equal(await page.locator('.rd-mobile-nav .rd-theme-btn').evaluate(element => element === document.activeElement), true, 'Shift+Tab from Close wraps to Theme')
    await page.keyboard.press('Tab')
    assert.equal(await page.locator('.rd-menu-btn').evaluate(element => element === document.activeElement), true, 'Tab from Theme wraps to Close')
    await page.keyboard.press('Enter')
    await page.waitForFunction(() => document.getElementById('mobile-navigation')?.getAttribute('aria-hidden') === 'true', null, { timeout: 3000 })
    assert.equal(await page.locator('#mobile-navigation').getAttribute('aria-hidden'), 'true')
    assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden')
  })
  await check('desktop transition releases mobile scroll lock and restores visible focus', async page => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
    await page.waitForFunction(() => document.body.style.overflow === 'hidden', null, { timeout: 3000 })
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden')
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.waitForFunction(() => document.body.style.overflow !== 'hidden', null, { timeout: 3000 })
    assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden')
    assert.equal(await page.locator('#mobile-navigation').getAttribute('aria-hidden'), 'true')
    assert.equal(await page.locator('.rd-brand').evaluate(element => element === document.activeElement), true)
    await page.setViewportSize({ width: 390, height: 844 })
    assert.equal(await page.locator('.rd-menu-btn').getAttribute('aria-expanded'), 'false')
  })
  await check('theme control has a 44px target on a desktop fine pointer', async page => {
    const bounds = await page.locator('.rd-desktop-nav .rd-theme-btn').boundingBox()
    assert.ok(bounds.width >= 43.99 && bounds.height >= 43.99, `target is ${bounds.width} × ${bounds.height}`)
  })
  for (const width of [1180, 1280]) {
    await check(`desktop ${width}: full name and navigation do not overlap`, async page => {
      const geometry = await page.locator('.rd-header').evaluate(element => {
        const header = element.getBoundingClientRect()
        const wordmark = element.querySelector('.rd-brand-wordmark')
        const brand = wordmark.getBoundingClientRect()
        const nav = element.querySelector('.rd-desktop-nav').getBoundingClientRect()
        return { text: wordmark.textContent, nameRight: brand.right, navLeft: nav.left, navRight: nav.right, headerRight: header.right, gap: nav.left - brand.right }
      })
      await page.screenshot({ path: `${output}/header-${width}-${await page.locator('html').getAttribute('data-theme')}.png`, animations: 'disabled' })
      assert.ok(geometry.text.includes('Manuel García-Llera Añón'))
      assert.ok(geometry.gap >= 0, `Name/navigation overlap: ${JSON.stringify(geometry)}`)
      assert.ok(geometry.navRight <= geometry.headerRight + .01, `Navigation outside header: ${JSON.stringify(geometry)}`)
      return geometry
    }, { width })
  }
  await check('desktop to mobile transition preserves a visible header focus target', async page => {
    await page.locator('.rd-desktop-nav a').first().focus()
    await page.setViewportSize({ width: 390, height: 844 })
    await page.locator('.rd-menu-btn').waitFor({ state: 'visible' })
    await page.waitForTimeout(100)
    const focus = await page.evaluate(() => {
      const active = document.activeElement
      const rect = active.getBoundingClientRect()
      return { element: active.outerHTML.slice(0, 300), visibleControl: active.matches('.rd-brand,.rd-menu-btn,.rd-mobile-contact') && rect.width > 0 && rect.height > 0 && rect.top >= 0 }
    })
    assert.ok(focus.visibleControl, `Focus lost at mobile breakpoint: ${JSON.stringify(focus)}`)
    return focus
  })
  for (const width of [390, 1280]) {
    await check(`contact ${width}: layout, field focus and synthetic status contrast`, async page => {
      await page.locator('#contact-name').focus()
      await page.locator('#contact-name').evaluate(async element => {
        element.getBoundingClientRect()
        await new Promise(requestAnimationFrame)
        await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => undefined)))
      })
      const geometry = await page.locator('.rd-contact-form').evaluate(element => {
        const input = element.querySelector('#contact-name')
        const bounds = element.getBoundingClientRect()
        const style = getComputedStyle(input)
        return { width: bounds.width, left: bounds.left, right: bounds.right, inputFocusColor: style.borderBottomColor, inputFocusWidth: style.borderBottomWidth,
          fieldsFit: [...element.querySelectorAll('input:not([name="website"]),textarea')].every(field => field.getBoundingClientRect().right <= innerWidth && field.getBoundingClientRect().left >= 0) }
      })
      assert.ok(geometry.fieldsFit, 'Contact fields stay inside the viewport')
      const states = []
      for (const state of ['success', 'error']) {
        const colors = await page.locator('.rd-contact-form__status').evaluate(async (element, value) => {
          element.className = `rd-contact-form__status is-${value}`
          element.textContent = `Estado sintético de ${value}; no se ha enviado un formulario.`
          element.getBoundingClientRect()
          await new Promise(requestAnimationFrame)
          await Promise.all(element.getAnimations().map(animation => animation.finished.catch(() => undefined)))
          return { color: getComputedStyle(element).color, background: getComputedStyle(element.closest('.rd-contact')).backgroundColor }
        }, state)
        const ratio = contrast(colors.color, colors.background)
        assert.ok(ratio >= 4.5, `${state}: contrast ${ratio}`)
        states.push({ state, ...colors, ratio })
      }
      assert.notEqual(states[0].color, states[1].color, 'Success and error retain distinct semantic colors after transitions')
      await page.locator('.rd-contact').screenshot({ path: `${output}/contact-${width}-${await page.locator('html').getAttribute('data-theme')}.png`, animations: 'disabled' })
      return { ...geometry, states, syntheticStatus: true }
    }, { route: '/#contacto', width })
    await check(`footer ${width}: visible keyboard focus on its fixed dark surface`, async page => {
      const link = page.locator('.rd-footer nav a').first()
      await link.focus()
      // Enter through an actual keyboard step: Firefox does not promise a
      // focus-visible ring for focus() alone after pointer interaction.
      await page.keyboard.press('Shift+Tab')
      await page.keyboard.press('Tab')
      assert.equal(await link.evaluate(element => element === document.activeElement), true)
      const styles = await link.evaluate(element => ({ color: getComputedStyle(element).outlineColor, width: getComputedStyle(element).outlineWidth,
        style: getComputedStyle(element).outlineStyle, focused: element.matches(':focus-visible'), background: getComputedStyle(element.closest('.rd-footer')).backgroundColor }))
      assert.ok(styles.focused)
      assert.notEqual(styles.style, 'none')
      const ratio = contrast(styles.color, styles.background)
      assert.ok(ratio >= 3, `Focus contrast ${ratio}: ${JSON.stringify(styles)}`)
      await page.locator('.rd-footer').screenshot({ path: `${output}/footer-${width}-${await page.locator('html').getAttribute('data-theme')}.png`, animations: 'disabled' })
      return { ...styles, ratio }
    }, { width })
  }
  if (failures.length) throw new Error(failures.join('\n'))
} finally {
  await writeFile(`${output}/${filter || 'results'}.json`, JSON.stringify({ base, engine: engineName, version: browser.version(), reducedMotion, results }, null, 2))
  await browser.close()
}
