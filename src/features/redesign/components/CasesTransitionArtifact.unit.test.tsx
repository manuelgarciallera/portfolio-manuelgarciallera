import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { CasesTransitionArtifact } from './CasesTransitionArtifact'

describe('CasesTransitionArtifact', () => {
  it('is one non-interactive real image asset', () => {
    const markup = renderToStaticMarkup(<CasesTransitionArtifact />)
    expect(markup).toContain('class="rd-cases-transition"')
    expect(markup).toContain('cases-convergence-v1.webp')
    expect(markup).toContain('aria-hidden="true"')
    expect(markup).not.toContain('<button')
  })
})
