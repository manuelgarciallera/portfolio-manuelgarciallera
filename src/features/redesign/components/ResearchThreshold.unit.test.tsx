import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ResearchThreshold } from './ResearchThreshold'

describe('ResearchThreshold', () => {
  it('uses a decorative real asset without adding redundant copy or a call to action', () => {
    const markup = renderToStaticMarkup(<ResearchThreshold />)
    expect(markup).toContain('research-stained-glass-v1.webp')
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).not.toContain('<a')
    expect(markup).not.toContain('<button')
  })

  it('keeps the asset in the workspace', () => {
    expect(fs.existsSync(path.join(process.cwd(), 'public/art/research-stained-glass-v1.webp'))).toBe(true)
  })
})
