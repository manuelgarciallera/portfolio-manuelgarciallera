import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AboutPage } from '../about/AboutPage'
import { ArticlesIndex } from '../articles/ArticlesIndex'
import { RedesignCasesIndex } from '../case/RedesignCasesIndex'
import { ProcessPage } from '../process/ProcessPage'
import { ResearchPage } from '../research/ResearchPage'
import { getCaseCards } from '../content/card-data'

describe('public page introductions', () => {
  it.each([
    ['Proyectos', <RedesignCasesIndex key="projects" cases={getCaseCards()} />],
    ['Investigación', <ResearchPage key="research" />],
    ['Proceso', <ProcessPage key="process" />],
    ['Sobre mí', <AboutPage key="about" />],
    ['Blog', <ArticlesIndex key="blog" />],
  ])('introduces %s without a decorative zero index', (label, page) => {
    const html = renderToStaticMarkup(page)
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? ''
    const introduction = main.slice(0, main.indexOf('</h1>'))

    expect(introduction).not.toContain('data-index="00"')
    expect(introduction).toMatch(new RegExp(`<p[^>]*class="[^"]*rd-label[^>]*>\\s*${label}\\s*</p>`))
    expect(main.match(/<h1\b/g)).toHaveLength(1)
  })

  it('shows projects without repeating the landing introduction or linking back to its own index', () => {
    const html = renderToStaticMarkup(<RedesignCasesIndex cases={getCaseCards()} />)
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] ?? ''

    expect(main).not.toContain('Trabajo seleccionado')
    expect(main).not.toContain('Casos seleccionados')
    expect(main).not.toContain('Ver todos los proyectos')
    expect(main).not.toContain('href="/proyectos"')
    expect(main).toContain('href="/proyectos/buy-sell-marketplace"')
    expect(main).toContain('href="/proyectos/laliga-club-operations-hub"')
  })

  it('keeps the full public name in the about-page heading', () => {
    const html = renderToStaticMarkup(<AboutPage />)
    expect(html).toMatch(/<h1\b[^>]*>Manuel García-Llera Añón<\/h1>/)
  })
})
