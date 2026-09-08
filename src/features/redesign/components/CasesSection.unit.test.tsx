import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { CasesSection } from './CasesSection'
import { getCaseCards } from '../content/card-data'

describe('CasesSection', () => {
  it('selects the visible preview on desktop as well as mobile', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/CasesSection.tsx'), 'utf8')
    expect(source).not.toContain("window.matchMedia('(max-width: 767px)')")
    expect(source).toContain('selectCenteredPreview(regions, window.innerHeight)')
  })

  it('keeps unfinished placeholders out of the selected-project narrative', () => {
    const markup = renderToStaticMarkup(<CasesSection items={getCaseCards()} />)

    expect(markup).toContain('Del problema al producto')
    expect(markup).toContain('Ver todos los proyectos')
    expect(markup).toContain('href="/casos"')
    expect(markup).toContain('Buy&amp;Sell')
    expect(markup).toContain('LaLiga')
    expect(markup).toContain('Coordination')
    expect(markup).toContain('TheUX<em>Union</em>')
    expect(markup).not.toContain('Fintech')
    expect(markup).not.toContain('Estadio')
  })

  it('keeps Saturn isolated by starting directly with the cases label', () => {
    const markup = renderToStaticMarkup(<CasesSection items={getCaseCards()} />)
    expect(markup).not.toContain('rd-cases-transition')
    expect(markup).not.toContain('cases-convergence-v1.webp')
    expect(markup).toContain('Casos seleccionados')
  })
})
