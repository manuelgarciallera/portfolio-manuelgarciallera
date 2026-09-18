import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { SiteHeader } from './SiteHeader'

describe('SiteHeader', () => {
  it('offers both direct CV downloads only inside mobile navigation', () => {
    const markup = renderToStaticMarkup(<SiteHeader isDark onToggleTheme={() => undefined} />)
    const mobile = markup.split('id="mobile-navigation"')[1]
    const desktop = markup.split('id="mobile-navigation"')[0]
    expect(mobile).toContain('Descargar CV')
    expect(mobile.match(/download="[^"]+\.pdf"/g)).toHaveLength(2)
    expect(desktop).not.toContain('Descargar CV')
  })
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
    expect(markup).toContain('rd-brand-signature')
    expect(markup).toContain('rd-brand-m-color')
    expect(markup.match(/class="rd-brand-letter"/g)).toHaveLength(3)
    expect(markup).not.toContain('>MG<')
    expect(markup).not.toContain('rd-brand-facet')
    expect(markup).toContain('Proyectos')
    expect(markup).toContain('Investigación')
    expect(markup).toContain('Proceso')
    expect(markup).toContain('Sobre mí')
    expect(markup).toContain('Blog')
    expect(markup).toContain('rd-nav-contact')
  })
})
