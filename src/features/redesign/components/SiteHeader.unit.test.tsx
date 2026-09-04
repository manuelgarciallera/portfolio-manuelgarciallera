import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SiteHeader } from './SiteHeader'

describe('SiteHeader', () => {
  it('exposes an icon-only theme control with an accessible name', () => {
    const markup = renderToStaticMarkup(<SiteHeader isDark={false} onToggleTheme={() => undefined} forceVisible />)

    expect(markup).toContain('aria-label="Activar tema oscuro"')
    expect(markup).toContain('rd-theme-icon')
    expect(markup).not.toContain('>Noche<')
    expect(markup).not.toContain('Tema:')
  })

  it('makes editorial work and LinkedIn directly reachable', () => {
    const markup = renderToStaticMarkup(<SiteHeader isDark onToggleTheme={() => undefined} forceVisible />)

    expect(markup).toContain('href="/articulos"')
    expect(markup).toContain('linkedin.com/in/manuelgarciallera')
  })

  it('uses a geometric signature and recruiter-oriented navigation', () => {
    const markup = renderToStaticMarkup(<SiteHeader isDark onToggleTheme={() => undefined} forceVisible />)

    expect(markup).toContain('aria-label="Manuel García-Llera / Product Designer · Design Engineer"')
    expect(markup).toContain('rd-brand-monogram')
    expect(markup).toContain('>MG<')
    expect(markup).not.toContain('rd-brand-facet')
    expect(markup).toContain('Proyectos')
    expect(markup).toContain('Investigación')
    expect(markup).toContain('Proceso')
    expect(markup).toContain('Sobre mí')
    expect(markup).toContain('Blog')
    expect(markup).toContain('rd-nav-contact')
  })
})
