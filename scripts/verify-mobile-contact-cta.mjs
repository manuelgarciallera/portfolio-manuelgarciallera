import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const base = process.argv[2] || 'http://localhost:3040'
const browser = await chromium.launch()
await mkdir('.audit/mobile-contact', { recursive: true })
try {
  for (const theme of ['dark', 'light']) for (const width of [320, 390, 768]) {
    const page = await browser.newPage({ viewport: { width, height: width === 320 ? 568 : 844 }, hasTouch: true, isMobile: true })
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.addInitScript(t => localStorage.setItem('rd-theme', t), theme)
    await page.goto(`${base}/sobre-mi`, { waitUntil: 'networkidle', timeout: 60000 })
    const top = page.locator('.rd-mobile-contact')
    const topBefore = await top.evaluate(e => ({ bg: getComputedStyle(e).backgroundColor, image: getComputedStyle(e, '::before').backgroundImage }))
    await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
    const cta = page.locator('.rd-mobile-nav-contact')
    await cta.scrollIntoViewIfNeeded()
    const ring = await cta.evaluate(e => {
      const s = getComputedStyle(e, '::before')
      return { image:s.backgroundImage, animation:s.animationName, duration:s.animationDuration, radius:s.borderRadius, height:e.getBoundingClientRect().height }
    })
    assert.match(ring.image, /conic-gradient/, 'interior Contacto gets the Hero-style ring')
    assert.notEqual(ring.animation, 'none')
    assert.ok(parseFloat(ring.duration) >= 8, 'menu rotation is slower than Hero')
    assert.ok(ring.height >= 44, 'visible capsule is a full touch target')
    assert.deepEqual(await top.evaluate(e => ({ bg: getComputedStyle(e).backgroundColor, image: getComputedStyle(e, '::before').backgroundImage })), topBefore)
    const utilities = page.locator('.rd-mobile-nav-utilities')
    const gap = await utilities.evaluate(e => e.getBoundingClientRect().top - document.querySelector('.rd-mobile-nav-contact').getBoundingClientRect().bottom)
    assert.ok(gap >= 20 && gap <= 40, `CV stays close but separate: ${gap}`)
    assert.equal(await utilities.evaluate(e => e.getAnimations({ subtree:true }).length), 0, 'CV and utilities stay neutral')
    await utilities.locator('summary').click()
    assert.equal(await utilities.locator('a[download]').count(), 2, 'both CV languages remain available')
    await utilities.locator('summary').click()
    await cta.scrollIntoViewIfNeeded()
    await page.screenshot({path:`.audit/mobile-contact/${width}-${theme}.png`})
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await cta.evaluate(e => getComputedStyle(e, '::before').animationName), 'none')
    await cta.click()
    await page.waitForURL(`${base}/#contacto`)
    assert.equal(await page.locator('#mobile-navigation').getAttribute('aria-hidden'), 'true')
    assert.equal(await cta.evaluate(e => getComputedStyle(e, '::before').animationName), 'none', 'closed menu has no running ring')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    assert.equal(await cta.evaluate(e => getComputedStyle(e, '::before').animationName), 'none')
    await page.evaluate(() => scrollTo({top:0,behavior:'instant'}))
    await page.waitForTimeout(500)
    await page.getByRole('button', { name: 'Abrir menú', exact: true }).click()
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('#mobile-navigation').getAttribute('aria-hidden'), 'true')
    assert.deepEqual(errors, [])
    console.log(`PASS ${width} ${theme}: ring, hierarchy, touch target, close/contact navigation, reduced motion`)
    await page.close()
  }
  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await desktop.goto(`${base}/sobre-mi`, {waitUntil:'networkidle',timeout:60000})
  assert.equal(await desktop.locator('#mobile-navigation').isVisible(), false)
  assert.equal(await desktop.locator('.rd-desktop-contact').evaluate(e => getComputedStyle(e, '::before').backgroundImage), 'none')
  console.log('PASS desktop: mobile menu hidden, upper Contacto has no gradient ring')
} finally { await browser.close() }
