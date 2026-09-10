import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { chromium } from 'playwright'
import { createLocalReq } from 'payload'
import { PagePreviewDocument } from '../../src/components/PagePreviewDocument.tsx'
import { loadSnapshotVisualPreview } from '../../src/preview/snapshot-visual.ts'

// Executed from the recovery bundle. esbuild emits the real CSS module beside it.
export const verifySnapshotInBrowser = async (fixture, owner, snapshot, credentials) => {
  const css = await readFile(new URL(import.meta.url.replace(/\.mjs$/, '.css')), 'utf8')
  const preview = await loadSnapshotVisualPreview({ req: await createLocalReq({ user: owner }, fixture.payload), snapshotId: String(snapshot.id) })
  const markup = renderToStaticMarkup(createElement(PagePreviewDocument, { preview }))
  const browser = await chromium.launch({ headless: true })
  try {
    for (const width of [390, 1280]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } })
      try {
        const login = await context.request.post(`${fixture.origin}/api/users/login`, { data: credentials })
        assert.equal(login.status(), 200)
        const page = await context.newPage()
        const errors = []
        page.on('pageerror', error => errors.push(error.message))
        // Establish the actual same origin; no interception or fake responses.
        await page.goto(`${fixture.origin}/api/users/me`)
        await page.setContent(`<html><head><style>body{margin:0}main{container:preview-page / inline-size}${css}</style></head><body><main>${markup}</main></body></html>`)
        const image = page.locator('img')
        assert.equal(await image.count(), 1)
        await image.scrollIntoViewIfNeeded()
        await image.evaluate(async img => { await img.decode() })
        const measured = await image.evaluate(img => {
          const canvas = document.createElement('canvas'); canvas.width = 1; canvas.height = 1
          const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, 1, 1)
          return { width: img.naturalWidth, height: img.naturalHeight, pixel: Array.from(ctx.getImageData(0, 0, 1, 1).data), displayedWidth: img.getBoundingClientRect().width }
        })
        assert.deepEqual(measured.pixel, [255, 255, 0, 255], 'Historical yellow original, not the newly edited green media')
        assert.equal(measured.width, 1200); assert.equal(measured.height, 800)
        assert(measured.displayedWidth > 0 && measured.displayedWidth <= width)
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
        assert.deepEqual(errors, [])
        await page.screenshot({ path: `node_modules/.cache/snapshot-image-${width}.png`, fullPage: true })
      } finally { await context.close() }
    }
  } finally { await browser.close() }
}
