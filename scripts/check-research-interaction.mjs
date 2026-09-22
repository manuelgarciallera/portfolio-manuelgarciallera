import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium, firefox } from 'playwright'
import sharp from 'sharp'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3102'
const output = path.resolve(process.argv[3] ?? '.audit/research-interaction-20260923')
const browserName = process.argv[4] ?? 'chromium'
const browserType = { chromium, firefox }[browserName]
assert.ok(browserType, 'Browser must be chromium or firefox')
const results = []
await fs.mkdir(output, { recursive: true })
const browser = await browserType.launch({ headless: true })

async function contextFor(width, theme, reducedMotion) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 768, reducedMotion })
  // Observe public WebGL calls, not React/Fiber internals. Calls retain their
  // original arguments and receiver; only this test context owns the counters.
  await context.addInitScript(theme => {
    localStorage.setItem('rd-theme', theme)
    const counts = new WeakMap()
    window.__researchDrawCount = canvas => counts.get(canvas) ?? 0
    for (const Context of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
      if (!Context) continue
      for (const method of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
        const descriptor = Object.getOwnPropertyDescriptor(Context.prototype, method)
        if (typeof descriptor?.value !== 'function') continue
        const original = descriptor.value
        Object.defineProperty(Context.prototype, method, { ...descriptor, value: function (...args) {
          counts.set(this.canvas, (counts.get(this.canvas) ?? 0) + 1)
          return Reflect.apply(original, this, args)
        } })
      }
    }
  }, theme)
  return context
}

async function openScene(context) {
  const page = await context.newPage()
  page.setDefaultTimeout(20_000)
  page.setDefaultNavigationTimeout(40_000)
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  const scene = page.locator('.rd-research-scene')
  await scene.waitFor()
  await scene.scrollIntoViewIfNeeded()
  const button = page.getByRole('button', { name: 'Cambiar el color de Saturno', exact: true })
  const canvas = scene.locator('canvas')
  await canvas.waitFor()
  await page.waitForFunction(() => {
    const canvas = document.querySelector('.rd-research-scene canvas')
    return canvas && window.__researchDrawCount(canvas) > 0
  })
  await page.evaluate(async () => { await document.fonts.ready })
  await page.waitForTimeout(350)
  const box = await button.boundingBox()
  assert.ok(box && box.width >= 44 && box.height >= 44, 'Saturn control must have a 44px minimum target')
  assert.equal(await button.evaluate(element => Boolean(element.closest('[aria-hidden="true"]'))), false, 'Saturn control is hidden from assistive technology')
  return { page, scene, button, canvas, errors, box }
}

async function sample(canvas, name) {
  // Browser screenshots read composited pixels; toDataURL may be blank because
  // the production WebGL context intentionally does not preserve its buffer.
  const png = await canvas.screenshot({ path: path.join(output, `${name}.png`), timeout: 20_000 })
  const image = sharp(png)
  const { width, height } = await image.metadata()
  const size = Math.floor(Math.min(width, height) * 0.25)
  const { data, info } = await image.extract({ left: Math.floor((width - size) / 2), top: Math.floor((height - size) / 2), width: size, height: size }).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  let chroma = 0
  let luminance = 0
  for (let offset = 0; offset < data.length; offset += info.channels) {
    const [r, g, b] = data.subarray(offset, offset + 3)
    chroma += Math.max(r, g, b) - Math.min(r, g, b)
    luminance += r * 0.2126 + g * 0.7152 + b * 0.0722
  }
  return { name, chroma: chroma / (size * size), luminance: luminance / (size * size), size, data }
}

function metric(sample) {
  return { name: sample.name, chroma: sample.chroma, luminance: sample.luminance, size: sample.size }
}

function pixelDifference(first, second) {
  assert.equal(first.data.length, second.data.length, 'Core sample dimensions changed')
  let difference = 0
  for (let index = 0; index < first.data.length; index++) difference += Math.abs(first.data[index] - second.data[index])
  return difference / first.data.length
}

async function drawCount(canvas) {
  return canvas.evaluate(element => window.__researchDrawCount(element))
}

try {
  // Each input modality starts from neutral, so an already-active pulse cannot
  // make an ineffective click/key appear to pass. No product clock is mocked.
  for (const profile of [
    { width: 390, theme: 'dark', input: 'touch' },
    { width: 390, theme: 'light', input: 'click' },
    { width: 1440, theme: 'dark', input: 'Enter' },
    { width: 1440, theme: 'light', input: 'Space' },
  ]) {
    const context = await contextFor(profile.width, profile.theme, 'reduce')
    try {
      const { page, scene, button, canvas, errors, box } = await openScene(context)
      const id = `${browserName}-${profile.width}-${profile.theme}-${profile.input}`
      assert.equal(await scene.getAttribute('data-research-motion'), 'paused')
      const baseline = await sample(canvas, `${id}-neutral`)
      const beforeIdle = await drawCount(canvas)
      await page.waitForTimeout(500)
      const idleDraws = await drawCount(canvas) - beforeIdle
      assert.equal(idleDraws, 0, 'Reduced motion renders continuously while idle')
      let focus = null
      if (['Enter', 'Space'].includes(profile.input)) {
        await page.keyboard.press('Tab')
        await button.focus()
        focus = await button.evaluate(element => ({ visible: element.matches(':focus-visible'), width: parseFloat(getComputedStyle(element).outlineWidth) }))
        assert.ok(focus.visible && focus.width >= 2, 'Keyboard control lacks visible focus')
        await page.keyboard.press(profile.input)
      } else if (profile.input === 'touch') {
        await button.tap()
      } else {
        await button.click()
      }
      await page.waitForFunction(() => document.querySelector('.rd-research-scene')?.dataset.researchColour === 'gradient')
      await page.waitForTimeout(200)
      const coloured = await sample(canvas, `${id}-gradient`)
      assert.ok(coloured.chroma > baseline.chroma + 12, 'Input changes DOM state but sphere pixels do not become coloured')
      await page.waitForTimeout(500)
      const staticColour = await sample(canvas, `${id}-static`)
      const staticDifference = pixelDifference(coloured, staticColour)
      assert.ok(staticDifference <= 1, 'Reduced-motion feedback is animated rather than static')
      await page.waitForFunction(() => document.querySelector('.rd-research-scene')?.dataset.researchColour === 'neutral', null, { timeout: 7500 })
      await page.waitForTimeout(200)
      const reset = await sample(canvas, `${id}-reset`)
      const resetDifference = pixelDifference(baseline, reset)
      assert.ok(resetDifference <= 2, 'Six-second reset does not restore the graphite sphere')
      assert.deepEqual(errors, [], 'Browser runtime error')
      results.push({ browser: browserName, ...profile, reducedMotion: true, target: { width: box.width, height: box.height }, focus, idleDraws, staticDifference, resetDifference, samples: [baseline, coloured, staticColour, reset].map(metric), errors })
    } finally {
      await context.close()
    }
  }

  const context = await contextFor(1440, 'dark', 'no-preference')
  try {
    const { page, scene, button, canvas, errors } = await openScene(context)
    await page.waitForFunction(() => document.querySelector('.rd-research-scene')?.dataset.researchMotion === 'running')
    const beforeRunning = await drawCount(canvas)
    await page.waitForTimeout(600)
    const runningDraws = await drawCount(canvas) - beforeRunning
    assert.ok(runningDraws > 0, 'Visible normal-motion artwork does not render')
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.waitForFunction(() => document.querySelector('.rd-research-scene')?.dataset.researchMotion === 'paused')
    await page.waitForTimeout(350)
    const beforeOffscreen = await drawCount(canvas)
    await page.waitForTimeout(700)
    const offscreenDraws = await drawCount(canvas) - beforeOffscreen
    assert.equal(offscreenDraws, 0, 'Offscreen Saturn continues drawing')
    await scene.scrollIntoViewIfNeeded()
    await page.waitForFunction(() => document.querySelector('.rd-research-scene')?.dataset.researchMotion === 'running')

    const otherPage = await context.newPage()
    await otherPage.goto('about:blank')
    await otherPage.bringToFront()
    await page.waitForTimeout(350)
    const genuinelyHidden = await page.evaluate(() => document.visibilityState === 'hidden')
    let hiddenTab = { verified: false, reason: 'Headless engine kept the background page visible; no synthetic visibility result is claimed.' }
    if (genuinelyHidden) {
      await page.waitForFunction(() => document.querySelector('.rd-research-scene')?.dataset.researchMotion === 'paused')
      const beforeHidden = await drawCount(canvas)
      await page.waitForTimeout(700)
      const hiddenDraws = await drawCount(canvas) - beforeHidden
      assert.equal(hiddenDraws, 0, 'Hidden-tab Saturn continues drawing')
      hiddenTab = { verified: true, hiddenDraws }
    }
    await otherPage.close()
    await page.bringToFront()
    await page.waitForFunction(() => document.querySelector('.rd-research-scene')?.dataset.researchMotion === 'running')

    // A manual reset starts the neutral cycle at a known appearance phase.
    // Compare brightness within one engine, never pixel equality across engines.
    await button.click()
    await page.waitForFunction(() => document.querySelector('.rd-research-scene')?.dataset.researchColour === 'neutral', null, { timeout: 7500 })
    await page.waitForTimeout(150)
    const cycle = [await sample(canvas, `${browserName}-cycle-00`)]
    const cycleStart = Date.now()
    for (const second of [6, 12, 18, 24]) {
      await page.waitForTimeout(Math.max(0, cycleStart + second * 1000 - Date.now()))
      cycle.push(await sample(canvas, `${browserName}-cycle-${String(second).padStart(2, '0')}`))
    }
    const brightening = cycle[2].luminance - cycle[0].luminance
    const returnDistance = Math.abs(cycle[4].luminance - cycle[0].luminance)
    assert.ok(brightening >= 8, 'Automatic cycle does not visibly lighten the graphite sphere')
    assert.ok(returnDistance < brightening * 0.55, 'Automatic cycle does not return towards graphite after 24 seconds')
    assert.deepEqual(errors, [], 'Browser runtime error')
    results.push({ browser: browserName, width: 1440, theme: 'dark', reducedMotion: false, runningDraws, offscreenDraws, hiddenTab, brightening, returnDistance, cycle: cycle.map(metric), errors })
  } finally {
    await context.close()
  }
  console.log(`PASS ${results.length} ${browserName} Saturn interaction profiles`)
} finally {
  await browser.close()
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2))
}
