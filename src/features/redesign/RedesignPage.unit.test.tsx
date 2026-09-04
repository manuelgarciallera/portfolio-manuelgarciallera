import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { RedesignPage } from './RedesignPage'

describe('RedesignPage', () => {
  it('uses the dark theme for both server and initial client rendering', () => {
    const markup = renderToStaticMarkup(<RedesignPage />)

    expect(markup).toContain('aria-label="Activar tema claro"')
  })

  it('does not repeat the same capabilities after the evidence accordion', () => {
    const markup = renderToStaticMarkup(<RedesignPage />)

    expect(markup).toContain('Lo que hago')
    expect(markup).not.toContain('data-index=')
    expect(markup).not.toContain('rd-axes')
  })

  it('keeps the stained-glass experiment out of the current landing', () => {
    const markup = renderToStaticMarkup(<RedesignPage />)
    expect(markup).not.toContain('rd-research-threshold')
    expect(markup).not.toContain('research-stained-glass-v1.webp')
  })
})
