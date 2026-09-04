import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { getCaseBySlug } from '../content/cases'
import { CaseStory } from './CaseStory'

describe('CaseStory', () => {
  const study = getCaseBySlug('buy-sell-marketplace')!

  it('renders the visual narrative in its authored order', () => {
    const markup = renderToStaticMarkup(<CaseStory study={study} />)
    const positions = [
      'De la materia al marketplace.',
      'Un mismo producto. Tres formas de decidir.',
      'Los fundamentos toman forma.',
      'Explorar, comprender y actuar.',
      'El sistema sobrevive al traspaso.',
    ].map((text) => markup.indexOf(text))

    expect(positions.every((position) => position >= 0)).toBe(true)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    expect(markup).toContain('Fundamentos, marca y navegación del sistema de diseño Buy&amp;Sell')
  })

  it('prioritizes the implemented product over the external Figma evidence', () => {
    const markup = renderToStaticMarkup(<CaseStory study={study} />)

    expect(markup.indexOf('Ver el producto implementado')).toBeLessThan(markup.indexOf('Explorar el sistema en Figma'))
    expect(markup).toContain('target="_blank"')
    expect(markup).toContain('rel="noreferrer"')
  })

  it('frames the story as a prelude with progress and a product gateway', () => {
    const markup = renderToStaticMarkup(<CaseStory study={study} />)

    expect(markup).toContain('aria-label="Recorrido del preámbulo"')
    expect(markup).toContain('Del sistema a la experiencia')
    expect(markup).toContain('Entrar en el proyecto')
    expect(markup).toContain('href="#fase-desarrollo"')
  })

  it('keeps the outer media surface neutral and restores a themed inner frame', () => {
    const markup = renderToStaticMarkup(<CaseStory study={study} />)

    expect(markup).toContain('rd-case-story__frame rd-case-story__frame--buy-sell')
  })
})
