import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

// Exercise the actual styles in a deterministic geometry fixture, without a
// server, screenshot mocks or dependencies in the public bundle.
const rootCSS = await readFile('src/features/redesign/redesign.css', 'utf8')
const coverCSS = await readFile('src/features/redesign/nude-project/nude-project.css', 'utf8')
const pulseCSS = await readFile('src/features/redesign/components/project-frame-effects.css', 'utf8').catch(error => {
  if (error.code === 'ENOENT') return ''
  throw error
})
const browser = await chromium.launch()
const failures = []
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } })
    await page.setContent(`<style>${rootCSS}\n${coverCSS}\n${pulseCSS}
      body { margin:0; } .fixture { position:relative; width:100%; height:600px; overflow:hidden; }
      .rd-project-cover { position:absolute; inset:0; display:block; }
      [data-photo] { position:absolute; inset:0; width:100%; height:100%; }
    </style><div class="rd-root" data-theme="dark"><div class="fixture rd-case-visual" data-engaged="true">
      <span class="rd-project-cover rd-nude-cover"><span class="rd-nude-cover__photo"><img data-photo alt="" /></span></span>
    </div></div>`)
    for (const time of [0, 2250, 4500, 6750]) {
      const covered = await page.evaluate(time => {
        for (const animation of document.getAnimations()) { animation.pause(); animation.currentTime = time }
        return [2, innerWidth - 2].every(x => [2, 300, 598].every(y => document.elementFromPoint(x, y)?.hasAttribute('data-photo')))
      }, time)
      if (!covered) failures.push(`Cover exposes a side at ${width}px / ${time}ms`)
    }
    await page.setContent(`<style>${rootCSS}\n${pulseCSS}</style><div class="rd-root" data-theme="dark">
      <div class="rd-preview-carousel" data-frame="slide"><div class="rd-preview-viewport">
        <div class="rd-preview-slide" data-active="true"></div><div class="rd-preview-slide" data-active="false"></div>
      </div></div></div>`)
    const states = await page.locator('.rd-preview-slide').evaluateAll(elements => elements.map(element => {
      const style = getComputedStyle(element, '::after')
      return { animation: style.animationName, iterations: style.animationIterationCount, pointer: style.pointerEvents }
    }))
    if (states[0].animation === 'none' || states[0].iterations !== '1' || states[0].pointer !== 'none') failures.push(`Missing single non-blocking frame pulse at ${width}px`)
    if (states[1].animation !== 'none') failures.push(`Hidden slide animates at ${width}px`)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await page.locator('.rd-preview-slide').first().evaluate(el => getComputedStyle(el, '::after').animationName), 'none')
    await page.close()
  }
  assert.deepEqual(failures, [])
  console.log('PASS: full-bleed cover at 4 widths / 4 motion positions; single frame pulse, inactive slides and reduced motion.')
} finally { await browser.close() }
