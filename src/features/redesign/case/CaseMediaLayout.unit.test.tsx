import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { ImageConfigContext } from 'next/dist/shared/lib/image-config-context.shared-runtime'
import { imageConfigDefault } from 'next/dist/shared/lib/image-config'
import { chromium, type Browser, type Page } from 'playwright'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getCaseBySlug } from '../content/cases'
import { CaseVisualJourney } from './CaseVisualJourney'
import { PhaseSection } from './CaseBlocks'

// Real components and CSS in Chromium: catches selector leakage and lost media
// width, which static markup assertions cannot detect. No app server is needed.
const widths = [320, 390, 768, 1024, 1366, 1440]
const css = ['redesign.css', 'case/project-evidence.css']
  .map(file => fs.readFileSync(path.join(process.cwd(), 'src/features/redesign', file), 'utf8')).join('\n')
let browser: Browser
let page: Page

beforeAll(async () => {
  browser = await chromium.launch()
  page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
  await page.route('http://case-layout.test/**', async route => {
    const url = new URL(route.request().url())
    const src = url.searchParams.get('url') ?? url.pathname
    if (src.startsWith('/projects/')) {
      await route.fulfill({ body: fs.readFileSync(path.join(process.cwd(), 'public', src)), contentType: 'image/webp' })
    } else await route.abort()
  })
}, 30000)
afterAll(async () => { await browser?.close() })

function renderEvidence(children: ReactNode) {
  return renderToStaticMarkup(<ImageConfigContext.Provider value={{ ...imageConfigDefault, qualities: [75, 92] }}>{children}</ImageConfigContext.Provider>)
}

async function fixture(markup: string, width: number): Promise<Page> {
  await page.setViewportSize({ width, height: 900 })
  await page.setContent(`<base href="http://case-layout.test"><style>${css}</style>${markup}`)
  await page.locator('img').evaluateAll(async images => {
    for (const img of images) { if (img instanceof HTMLImageElement) { img.loading = 'eager'; await img.decode() } }
  })
  return page
}

describe('case media geometry', () => {
  it('keeps nested diagram content in one diagram instead of inheriting the journey columns', async () => {
    const study = getCaseBySlug('laliga-club-operations-hub')!
    const markup = renderEvidence(<CaseVisualJourney study={{ ...study, story: undefined, visual: {
      ...study.visual!, theme: 'coordination', slides: [{ kind: 'coordination-diagram', src: 'diagram:flow', label: 'Flujo', alt: 'Flujo', diagramVariant: 'flow' }],
    } }} />)
    for (const width of widths) {
      const page = await fixture(markup, width)
      try {
        const geometry = await page.locator('.rd-coordination-diagram').evaluate(el => {
          const rect = el.getBoundingClientRect()
          return { height: rect.height, width: rect.width, columns: getComputedStyle(el).gridTemplateColumns.split(' ').length,
            overflow: el.scrollWidth > el.clientWidth + 1,
            agentsHeight: el.querySelector('.rd-coordination-agents')!.getBoundingClientRect().height }
        })
        expect(geometry.columns, `${width}: diagram must not inherit editorial columns`).toBe(1)
        expect(geometry.height, `${width}: giant repeated panel`).toBeLessThan(650)
        expect(geometry.agentsHeight, `${width}: agents must not inherit a 50rem media stage`).toBeLessThan(180)
        expect(geometry.overflow, `${width}: diagram clipped`).toBe(false)
      } finally { await page.evaluate(() => window.scrollTo(0, 0)) }
    }
  }, 60000)

  it('gives a dense landscape board the full phase width even in an even-numbered phase', async () => {
    const markup = renderEvidence(<PhaseSection order={2}
      phase={{ id: 'prototipo', title: 'Prototipo', paragraphs: ['Componentes y estados del producto.'] }}
      visual={{ src: '/projects/buy-sell/figma-list-states-hd.webp', label: 'Componentes', alt: 'Componentes', fit: 'contain' }} theme="buy-sell" />)
    for (const width of widths) {
      const page = await fixture(markup, width)
      try {
        const geometry = await page.locator('.rd-case-phase').evaluate(el => {
          const style = getComputedStyle(el), image = el.querySelector('img')!.getBoundingClientRect()
          return { available: el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight), image: image.width, x: image.x }
        })
        expect(geometry.image, `${width}: dense board became a narrow thumbnail`).toBeGreaterThanOrEqual(geometry.available * .95)
        expect(geometry.x).toBeGreaterThanOrEqual(0)
        expect(geometry.x + geometry.image).toBeLessThanOrEqual(width + 1)
      } finally { await page.evaluate(() => window.scrollTo(0, 0)) }
    }
  }, 60000)

  it('keeps a mobile screen at readable device scale and retains the original-image control', async () => {
    const study = getCaseBySlug('laliga-club-operations-hub')!
    const markup = renderEvidence(<CaseVisualJourney study={{ ...study, story: undefined, visual: {
      ...study.visual!, slides: [{ src: '/projects/laliga/club-mobile-hd.webp', label: 'Mobile', alt: 'Panel móvil', fit: 'contain' }],
    } }} />)
    for (const width of widths) {
      const page = await fixture(markup, width)
      try {
        const image = await page.locator('img').boundingBox()
        expect(image!.width).toBeGreaterThanOrEqual(Math.min(230, width - 64))
        expect(image!.width).toBeLessThanOrEqual(368)
        expect(image!.height).toBeLessThanOrEqual(738)
        const link = page.getByRole('link', { name: 'Ampliar imagen: Panel móvil' })
        expect(await link.getAttribute('href')).toBe('/projects/laliga/club-mobile-hd.webp')
        expect((await link.locator('.rd-project-evidence__hint').boundingBox())!.height).toBeGreaterThanOrEqual(44)
        await link.focus()
        expect(await link.evaluate(el => el.matches(':focus-visible'))).toBe(true)
      } finally { await page.evaluate(() => window.scrollTo(0, 0)) }
    }
  }, 60000)
})
