import assert from 'node:assert/strict'
import { chromium, firefox } from 'playwright'

// This verifier navigates an already-built Next server. It never bundles fixtures.
const base = process.argv.find(arg => arg.startsWith('--base='))?.slice(7) ?? 'http://127.0.0.1:3102'
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Use an authorized local production candidate')
const engine = process.argv.includes('--firefox') ? 'firefox' : 'chromium'
const only = process.argv.find(arg => arg.startsWith('--only='))?.slice(7)
const browser = await (engine === 'firefox' ? firefox : chromium).launch({ headless: true })
const results = []
const nude = '/proyectos/nude-project'
const cases = ['buy-sell-marketplace', 'laliga-club-operations-hub', 'coordination-hub', 'the-ux-union', 'nude-project']

async function open(page, route) {
  const response = await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  assert.equal(response.status(), 200)
  await page.locator('h1').waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(250)
}

async function check(name, options, action) {
  if (only && name !== only) return
  const profile = { viewport: { width: 390, height: 844 }, ...options }
  if (engine === 'firefox') delete profile.isMobile
  const context = await browser.newContext(profile)
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.setDefaultTimeout(10000)
  try {
    const detail = await action(page)
    assert.deepEqual(errors, [], 'No page errors')
    results.push({ name, status: 'PASS', detail })
  } catch (error) {
    results.push({ name, status: 'FAIL', reason: error.message, errors, url: page.url() })
  } finally { await context.close() }
  console.log(JSON.stringify({ environment: 'local-production-server', base, engine, ...results.at(-1) }))
}

async function clipVisual(page, visual, fraction) {
  await visual.evaluate((element, visibleFraction) => {
    const rect = element.getBoundingClientRect()
    const capacity = Math.min(rect.height, innerHeight)
    window.scrollTo({ top: scrollY + rect.top - (innerHeight - capacity * visibleFraction), behavior: 'instant' })
  }, fraction)
  await page.waitForTimeout(150)
  return visual.evaluate(element => {
    const rect = element.getBoundingClientRect()
    return Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0)) / Math.min(rect.height, innerHeight)
  })
}

try {
  await check('six-real-views', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, async page => {
    await open(page, '/proyectos')
    const card = page.locator('[data-case-preview="the-ux-union"]')
    const tabs = card.getByRole('group', { name: 'Seleccionar vista' })
    assert.equal(await tabs.getByRole('button').count(), 6)
    const details = []
    for (const label of ['Mobile · Descubrir', 'Pitch · Nodos', 'Sistema · Componentes', 'Mobile · Nodos']) {
      const button = tabs.getByRole('button', { name: label, exact: true })
      await button.click()
      await page.waitForTimeout(100)
      const area = await tabs.boundingBox(), box = await button.boundingBox()
      assert.ok(box.x >= area.x - 1 && box.x + box.width <= area.x + area.width + 1, `${label}: selected tab contained`)
      assert.equal(await button.getAttribute('aria-current'), 'true')
      assert.equal(await card.locator('.rd-preview-slide[data-active="true"] img').count(), 1)
      details.push({ label, selectorWidth: area.width, buttonWidth: box.width })
    }
    return details
  })

  for (const width of [390, 1440]) await check(`real-lightbox-${width}`, { viewport: { width, height: 900 }, reducedMotion: 'reduce' }, async page => {
    await open(page, '/proyectos')
    await page.locator(`a.rd-case-title-reveal[href="${nude}"]`).click()
    await page.waitForURL(`${base}${nude}`)
    const trigger = page.locator('button.rd-project-evidence').first()
    await trigger.scrollIntoViewIfNeeded()
    await trigger.focus()
    const before = await page.evaluate(() => scrollY)
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog')
    await dialog.waitFor()
    const close = dialog.getByRole('button', { name: 'Cerrar imagen ampliada' })
    const target = await close.boundingBox()
    assert.ok(target.width >= 44 && target.height >= 44, '44px close target')
    assert.ok(await close.evaluate(element => element === document.activeElement), 'Initial focus')
    for (const key of ['Shift+Tab', 'Tab', 'Tab']) {
      await page.keyboard.press(key)
      assert.ok(await dialog.evaluate(element => element.contains(document.activeElement)), 'Native dialog focus contained')
    }
    await dialog.locator('img').evaluate(image => image.decode())
    const image = await dialog.locator('img').boundingBox()
    assert.ok(image.x >= 0 && image.y >= 0 && image.x + image.width <= width + 1 && image.y + image.height <= 901, 'Original image bounded')
    await page.keyboard.press('Escape')
    await dialog.waitFor({ state: 'detached' })
    assert.ok(await trigger.evaluate(element => element === document.activeElement), 'Focus restored')
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - before) <= 1, 'Scroll restored')
    await trigger.click(); await dialog.waitFor(); await close.click(); await dialog.waitFor({ state: 'detached' })
    await trigger.click(); await dialog.waitFor(); await page.mouse.click(2, 2); await dialog.waitFor({ state: 'detached' })
    await trigger.click(); await dialog.waitFor(); await page.goBack(); await page.waitForURL(`${base}/proyectos`)
    assert.notEqual(await page.evaluate(() => document.body.style.position), 'fixed', 'SPA back navigation unlocks body')
    return { close: target, image, escapeFocusAndScroll: true, closeButton: true, backdrop: true, backNavigation: true }
  })

  for (const width of [390, 1440]) await check(`real-next-case-threshold-${width}`, { viewport: { width, height: 900 }, reducedMotion: 'reduce' }, async page => {
    await open(page, nude)
    const visual = page.locator('.rd-next-case [data-case-preview]')
    await visual.scrollIntoViewIfNeeded()
    await page.mouse.move(0, 0)
    const below = await clipVisual(page, visual, .70)
    assert.ok(below > .68 && below < .72, `70% geometry, actual ${below}`)
    assert.equal(await visual.getAttribute('data-viewport-active'), 'false')
    const above = await clipVisual(page, visual, .80)
    assert.ok(above > .78 && above < .82, `80% geometry, actual ${above}`)
    assert.equal(await visual.getAttribute('data-viewport-active'), 'true')
    const selected = visual.locator('.rd-preview-tabs button').last()
    await selected.click()
    const label = await selected.textContent()
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.waitForTimeout(200)
    assert.equal(await selected.getAttribute('aria-current'), 'true', 'Manual selection survives leaving viewport')
    return { below, above, preservedManualLabel: label }
  })

  await check('real-mobile-pause', { hasTouch: true, isMobile: true }, async page => {
    await open(page, '/proyectos')
    const visual = page.locator('[data-case-preview="the-ux-union"]')
    await visual.scrollIntoViewIfNeeded()
    const pause = visual.getByRole('button', { name: 'Pausar secuencia' })
    await pause.click()
    await visual.getByRole('button', { name: 'Reanudar secuencia' }).waitFor()
    const state = await visual.locator('.rd-preview-controls > span').textContent()
    await page.waitForTimeout(4500)
    assert.equal(await visual.locator('.rd-preview-controls > span').textContent(), state)
    return { pausedState: state }
  })

  await check('real-title-bands', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, async page => {
    const titles = []
    for (const slug of cases) {
      await open(page, `/proyectos/${slug}`)
      const title = (await page.locator('h1').textContent()).replace(/\s+/g, ' ').trim()
      const rail = page.locator('[data-journey-title]')
      assert.equal(await rail.count(), 1)
      assert.equal(await rail.getAttribute('data-journey-title'), title)
      await rail.scrollIntoViewIfNeeded()
      const track = rail.locator('[data-title-track]')
      const before = await track.evaluate(element => getComputedStyle(element).transform)
      const box = await rail.boundingBox()
      await page.mouse.move(box.x + box.width * .98, box.y + box.height / 2)
      await page.waitForTimeout(120)
      assert.equal(await track.evaluate(element => getComputedStyle(element).transform), before, 'Reduced motion is stationary')
      titles.push(title)
    }
    return titles
  })

  await check('real-title-interaction', { viewport: { width: 1440, height: 900 } }, async page => {
    await open(page, nude)
    const rail = page.locator('[data-journey-title]'); await rail.scrollIntoViewIfNeeded()
    const track = rail.locator('[data-title-track]'), box = await rail.boundingBox()
    await page.mouse.move(box.x + box.width * .98, box.y + box.height / 2)
    const before = await track.evaluate(element => getComputedStyle(element).transform)
    await page.waitForTimeout(250)
    assert.notEqual(await track.evaluate(element => getComputedStyle(element).transform), before)
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    const initial = await track.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 - 100, box.y + box.height / 2, { steps: 5 })
    const dragged = await track.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)
    assert.ok(Math.abs(dragged - initial) >= 90)
    assert.equal(await rail.getAttribute('data-interacting'), 'true')
    await page.mouse.up()
    await rail.getByRole('button', { name: 'Pausar movimiento del nombre del proyecto' }).focus()
    await page.keyboard.press('Enter')
    assert.equal(await rail.getByRole('button', { name: 'Reanudar movimiento del nombre del proyecto' }).getAttribute('aria-pressed'), 'true')
    return { edgeMotion: true, mouseDrag: true, keyboardPause: true }
  })

  if (engine === 'chromium') await check('real-native-touch-title', { hasTouch: true, isMobile: true, reducedMotion: 'reduce' }, async page => {
    await open(page, nude)
    const rail = page.locator('[data-journey-title]'); await rail.scrollIntoViewIfNeeded()
    const cdp = await page.context().newCDPSession(page)
    const touch = async (from, to) => {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] })
      for (let index = 1; index <= 8; index++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: from.x + (to.x - from.x) * index / 8, y: from.y + (to.y - from.y) * index / 8 }] })
        await page.waitForTimeout(16)
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    }
    const track = rail.locator('[data-title-track]'), before = await track.evaluate(element => getComputedStyle(element).transform)
    const top = await page.evaluate(() => scrollY)
    let box = await rail.boundingBox()
    await touch({ x: 260, y: box.y + box.height / 2 }, { x: 100, y: box.y + box.height / 2 + 2 })
    assert.notEqual(await track.evaluate(element => getComputedStyle(element).transform), before)
    assert.ok(Math.abs(await page.evaluate(() => scrollY) - top) < 5)
    box = await rail.boundingBox()
    await touch({ x: 180, y: box.y + box.height / 2 }, { x: 182, y: box.y + box.height / 2 - 170 })
    assert.ok(await page.evaluate(() => scrollY) > top + 40)
    await cdp.detach()
    return { horizontalDrag: true, verticalNativeScroll: true }
  })
  console.log(JSON.stringify({ environment: 'local-production-server', base, engine, results }, null, 2))
  if (results.some(result => result.status === 'FAIL')) process.exitCode = 1
} finally { await browser.close() }
