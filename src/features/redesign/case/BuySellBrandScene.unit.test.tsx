import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { BuySellBrandScene } from './BuySellBrandScene'

describe('BuySellBrandScene', () => {
  it('builds the brand scene from exact identity and product layers', () => {
    const markup = renderToStaticMarkup(<BuySellBrandScene />)

    expect(markup).toContain('data-active="false"')
    expect(markup).toContain('Una identidad que se convierte en producto')
    expect(markup).toContain('/projects/buy-sell/logo-white.svg')
    expect(markup).toContain('rd-buy-sell-scene__lockup')
    expect(markup).toContain('<strong>Buy&amp;Sell</strong>')
    expect(markup).toContain('rd-buy-sell-scene__token')
    expect(markup).toContain('rd-buy-sell-scene__card')
    expect(markup).toContain('aria-hidden="true"')
  })

  it('exposes the resolved composition when reduced motion is requested', () => {
    const markup = renderToStaticMarkup(<BuySellBrandScene reducedMotion />)

    expect(markup).toContain('data-motion="reduced"')
    expect(markup).toContain('data-active="true"')
    expect(markup).toContain('Sistema de diseño convertido en producto digital')
  })
})
