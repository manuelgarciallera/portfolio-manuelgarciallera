import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { NextCase } from './NextCase'

describe('NextCase', () => {
  it('reuses the complete home project card for the next published case', () => {
    const markup = renderToStaticMarkup(<NextCase currentSlug="buy-sell-marketplace" />)

    expect(markup).toContain('Siguiente caso de estudio')
    expect(markup).toContain('rd-case-visual--laliga')
    expect(markup).toContain('Ver caso de estudio')
    expect(markup).toContain('href="/casos/laliga-club-operations-hub"')
    expect(markup).toContain('alt="LaLiga · Hub de Clubes"')
  })
})
