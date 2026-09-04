import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ResearchBanner } from './ResearchBanner'

describe('ResearchBanner', () => {
  it('presents the research direction with a dedicated interactive 3D artifact', () => {
    const markup = renderToStaticMarkup(<ResearchBanner />)
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/ResearchBanner.tsx'), 'utf8')

    expect(markup).toContain('Sistemas de interacción')
    expect(markup.match(/rd-research-title-line/g)).toHaveLength(3)
    expect(markup).toContain('id="investigacion"')
    expect(markup).toContain('rd-research-artifact')
    expect(source).toContain("dynamic(() => import('./ResearchArtifactCanvas')")
    expect(source).toContain('<ResearchArtifactCanvas')
    expect(source).not.toContain('hero-orbital-instrument-transparent-v2.webp')
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).not.toContain('<video')
  })
})
