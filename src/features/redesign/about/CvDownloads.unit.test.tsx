import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CvDownloads } from './CvDownloads'

describe('public CV downloads', () => {
  it('offers both languages as direct PDF downloads without preloading them', () => {
    const html = renderToStaticMarkup(createElement(CvDownloads))
    expect(html).toContain('<summary')
    expect(html).toContain('Descargar CV')
    expect(html).toContain('Español')
    expect(html).toContain('English')
    expect(html.match(/<a /g)).toHaveLength(2)
    expect(html.match(/download="[^"]+\.pdf"/g)).toHaveLength(2)
    expect(html).toContain('hrefLang="en"')
    expect(html).toContain('hrefLang="es"')
    expect(html).not.toMatch(/<iframe|<embed|<script|rel="preload"/)
  })

  it('points to the two reviewed PDFs rather than missing or swapped files', () => {
    const html = renderToStaticMarkup(createElement(CvDownloads))
    const links = [...html.matchAll(/href="(\/cv\/[^"]+)"/g)]
    expect(links).toHaveLength(2)
    const hashes = links.map(([, href]) => {
      const bytes = readFileSync(`public${href}`)
      expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
      return createHash('sha256').update(bytes).digest('hex')
    })
    expect(hashes).toEqual([
      '62fb12c81cacfe7720b40b166a506c535052d1d671d9a49f6967262152f5fdd3',
      'a98db5e606d67582b3f7b87d26e7cf97b7a1c61dc8d8f4d0c92cc7f32f085e97',
    ])
  })
})
