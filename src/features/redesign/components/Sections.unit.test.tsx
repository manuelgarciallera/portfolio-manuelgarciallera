import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ContactSection, Footer, ManifestoSection } from './Sections'

describe('ManifestoSection', () => {
  it('separates the quotation from the focus scene and keeps the construction object below', () => {
    const markup = renderToStaticMarkup(<ManifestoSection />)

    expect(markup).toContain('rd-quote-panel')
    expect(markup.indexOf('rd-quote-panel')).toBeLessThan(markup.indexOf('id="enfoque"'))
    expect(markup.indexOf('id="enfoque"')).toBeLessThan(markup.indexOf('rd-manifesto-art'))
    expect(markup).toContain('manifesto-system-assembly-v2.webp')
    expect(markup).not.toContain('manifesto-construction-blocks-v1.webp')
  })
})

describe('Footer', () => {
  it('offers useful navigation instead of a promotional claim', () => {
    const markup = renderToStaticMarkup(<Footer />)

    expect(markup).toContain('href="/sobre-mi"')
    expect(markup).toContain('href="/proyectos"')
    expect(markup).toContain('href="/proceso"')
    expect(markup).toContain('href="/blog"')
    expect(markup).toContain('href="/#contacto"')
    expect(markup).toContain('linkedin.com/in/manuelgarciallera')
    expect(markup).not.toContain('Diseño + IA, documentado con criterio')
    expect(markup).toContain('Manuel García-Llera Añón')
  })

  it('closes with one real dimensional artwork instead of layered CSS art', () => {
    const markup = renderToStaticMarkup(<Footer />)

    expect(markup).toContain('rd-footer-artwork')
    expect(markup).toContain('footer-liquid-ribbon-v2.webp')
    expect(markup).not.toContain('hero-orbital-instrument-transparent-v2.webp')
    expect(markup).not.toContain('rd-footer-art__')
  })
})

describe('ContactSection', () => {
  it('lands the contact anchor on the focusable Hablemos heading, not the section or form', () => {
    const markup = renderToStaticMarkup(<ContactSection />)

    expect(markup).toMatch(/<h2\b[^>]*id="contacto"[^>]*tabindex="-1"[^>]*>Hablemos/)
    expect(markup).toMatch(/<section\b[^>]*aria-labelledby="contacto"/)
    expect(markup.match(/id="contacto"/g)).toHaveLength(1)
    expect(markup).not.toMatch(/class="rd-contact-heading[^"\n]*rd-reveal/)
  })

  it('uses a private server-backed form instead of exposing a mailto address', () => {
    const markup = renderToStaticMarkup(<ContactSection />)

    expect(markup).toContain('<form')
    expect(markup).toContain('name="email"')
    expect(markup).toContain('name="message"')
    expect(markup).not.toContain('mailto:')
    expect(markup).not.toContain('@outlook.com')
  })
})
