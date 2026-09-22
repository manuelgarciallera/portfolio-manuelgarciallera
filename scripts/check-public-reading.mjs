import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium, firefox } from 'playwright'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3100'
const output = path.resolve(process.argv[3] ?? '.audit/public-reading-20260923')
const browserName = process.argv[4] ?? 'chromium'
const browserType = { chromium, firefox }[browserName]
assert.ok(browserType, 'Browser must be chromium or firefox')
const routes = ['/proyectos', '/investigacion', '/proceso', '/sobre-mi', '/blog']
const articles = [
  'del-objeto-a-la-interfaz',
  'sistemas-de-diseno-de-figma-a-codigo',
  'colaboracion-humano-ia-con-autoria',
  'interfaces-para-roles-y-estados-complejos',
]
const results = []
const browser = await browserType.launch({ headless: true })

try {
  for (const width of [320, 390, 1440]) {
    for (const theme of ['dark', 'light']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
      await context.addInitScript(value => localStorage.setItem('rd-theme', value), theme)
      const page = await context.newPage()
      page.setDefaultTimeout(15_000)
      page.setDefaultNavigationTimeout(30_000)
      let referenceLabel
      let referenceLabelGap
      for (const route of routes) {
        await page.goto(new URL(route, baseUrl).href, { waitUntil: 'domcontentloaded' })
        await page.locator('.rd-page-intro h1').waitFor()
        await page.evaluate(async theme => {
          localStorage.setItem('rd-theme', theme)
          document.documentElement.dataset.theme = theme
          await document.fonts.ready
        }, theme)
        const evidence = await page.locator('.rd-page-intro').evaluate(intro => {
          const title = intro.querySelector('h1')
          const lead = title.nextElementSibling
          const body = lead.nextElementSibling
          const label = intro.querySelector('.rd-label')
          const labelStyle = getComputedStyle(label)
          const titleStyle = getComputedStyle(title)
          const titleRect = title.getBoundingClientRect()
          return {
            titleRect: { x: titleRect.x, y: titleRect.y, width: titleRect.width, height: titleRect.height },
            titleStyle: [titleStyle.fontFamily, titleStyle.fontSize, titleStyle.fontWeight, titleStyle.lineHeight],
            titleWidth: title.clientWidth,
            titleScrollWidth: title.scrollWidth,
            titleLeadGap: lead.getBoundingClientRect().top - title.getBoundingClientRect().bottom,
            leadBodyGap: body ? body.getBoundingClientRect().top - lead.getBoundingClientRect().bottom : null,
            labelIndex: label.getAttribute('data-index'),
            labelTitleGap: titleRect.top - label.getBoundingClientRect().bottom,
            labelStyle: [labelStyle.fontFamily, labelStyle.fontSize, labelStyle.fontWeight, labelStyle.letterSpacing],
            trackAlignment: [...document.querySelectorAll('.rd-axis .rd-case-tags')].map(element => getComputedStyle(element).textAlign),
          }
        })
        assert.equal(evidence.labelIndex, null, `${route}: decorative page index`)
        assert.ok(evidence.titleScrollWidth <= evidence.titleWidth + 1, `${route}: title exceeds its column`)
        referenceLabel ??= evidence.labelStyle
        assert.deepEqual(evidence.labelStyle, referenceLabel, `${route}: page label differs from the shared scale`)
        referenceLabelGap ??= evidence.labelTitleGap
        assert.ok(Math.abs(evidence.labelTitleGap - referenceLabelGap) <= 1, `${route}: label-to-title spacing differs from the shared rhythm`)
        if (route !== '/proyectos' || width < 1024) {
          assert.ok(evidence.titleLeadGap >= 24, `${route}: title and lead touch`)
        }
        if (evidence.leadBodyGap !== null) assert.ok(evidence.leadBodyGap >= 24, `${route}: lead and body touch`)
        assert.ok(evidence.trackAlignment.every(alignment => alignment === 'left'), `${route}: track captions drift from their titles`)
        if (route === '/proyectos') {
          assert.equal(await page.locator('main a[href="/proyectos"]').count(), 0, 'Projects links to its own index')
          assert.equal(await page.getByText('Casos seleccionados', { exact: true }).count(), 0, 'Projects repeats the landing introduction')
        }
        if (route === '/sobre-mi') {
          const gap = await page.locator('.rd-page-action').evaluate(element => element.getBoundingClientRect().top - element.previousElementSibling.getBoundingClientRect().bottom)
          assert.ok(gap >= 24, 'About: follow-up action touches its explanation')
        }
        results.push({ browser: browserName, width, theme, route, ...evidence })
      }

      for (const slug of articles) {
        const route = `/blog/${slug}`
        await page.goto(new URL(route, baseUrl).href, { waitUntil: 'domcontentloaded' })
        await page.locator('.rd-article-prose').waitFor()
        await page.evaluate(async theme => {
          localStorage.setItem('rd-theme', theme)
          document.documentElement.dataset.theme = theme
          await document.fonts.ready
        }, theme)
        const evidence = await page.evaluate(() => {
          const title = document.querySelector('main h1')
          const titleStyle = getComputedStyle(title)
          const titleRect = title.getBoundingClientRect()
          return {
            titleRect: { x: titleRect.x, y: titleRect.y, width: titleRect.width, height: titleRect.height },
            titleStyle: [titleStyle.fontFamily, titleStyle.fontSize, titleStyle.fontWeight, titleStyle.lineHeight],
            titleWidth: title.clientWidth,
            titleScrollWidth: title.scrollWidth,
            paragraphGaps: [...document.querySelectorAll('.rd-article-prose p + p')].map(element => element.getBoundingClientRect().top - element.previousElementSibling.getBoundingClientRect().bottom),
            headingGaps: [...document.querySelectorAll('.rd-article-prose h2 + p')].map(element => element.getBoundingClientRect().top - element.previousElementSibling.getBoundingClientRect().bottom),
          }
        })
        assert.ok(evidence.titleScrollWidth <= evidence.titleWidth + 1, `${route}: title is clipped`)
        assert.ok(evidence.paragraphGaps.length > 0 && evidence.paragraphGaps.every(gap => gap >= 20), `${route}: paragraphs have no visible separation`)
        assert.ok(evidence.headingGaps.every(gap => gap >= 24), `${route}: section heading touches prose`)
        await page.keyboard.press('Tab')
        const focusChecks = []
        for (const selector of ['.rd-breadcrumbs a', '.rd-article-related', '.rd-article-next a']) {
          const link = page.locator(`.rd-article-page ${selector}`).first()
          await link.focus()
          const focus = await link.evaluate(element => {
            const style = getComputedStyle(element)
            let surface = element
            while (surface.parentElement && getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)') surface = surface.parentElement
            const luminance = color => {
              const channels = color.match(/[\d.]+/g).slice(0, 3).map(value => {
                const channel = Number(value) / 255
                return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
              })
              return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
            }
            const outline = luminance(style.outlineColor)
            const background = luminance(getComputedStyle(surface).backgroundColor)
            return { visible: element.matches(':focus-visible'), width: parseFloat(style.outlineWidth), contrast: (Math.max(outline, background) + 0.05) / (Math.min(outline, background) + 0.05) }
          })
          assert.ok(focus.visible && focus.width >= 2 && focus.contrast >= 3, `${route} ${selector}: insufficient focus contrast`)
          focusChecks.push({ selector, ...focus })
        }
        results.push({ browser: browserName, width, theme, route, ...evidence, focusChecks })
      }
      await context.close()
    }
  }
  console.log(`PASS ${results.length} ${browserName} public reading profiles`)
} finally {
  await browser.close()
  await fs.mkdir(output, { recursive: true })
  await fs.writeFile(path.join(output, 'results.json'), JSON.stringify(results, null, 2))
}
