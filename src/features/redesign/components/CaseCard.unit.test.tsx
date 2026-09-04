import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { CaseStudy } from '../content/types'
import { CaseCard } from './CaseCard'

const buySell: CaseStudy = {
  slug: 'buy-sell-marketplace',
  index: '01',
  title: 'Buy&Sell ',
  titleAccent: 'Marketplace',
  claim: 'Del sistema de diseño al producto full stack.',
  summary: 'Caso real de diseño y desarrollo.',
  year: '2026',
  context: 'Trabajo Fin de Máster',
  role: 'UX/UI y desarrollo',
  stack: ['Figma', 'Angular', 'Node.js', 'MySQL'],
  tags: 'Figma → Angular · CRM · Roles',
  published: true,
  status: 'evolving',
  contribution: 'Dirección UX/UI y sistema de diseño',
  visual: {
    theme: 'buy-sell',
    logoSrc: '/projects/buy-sell/logo-lockup.svg',
    logoAlt: 'Buy&Sell',
    kicker: 'Marketplace tecnológico',
    statement: 'Diseño, producto y sistema full stack.',
    slides: [
      {
        label: 'Producto final',
        src: '/projects/buy-sell/home-hd.webp',
        alt: 'Inicio de Buy&Sell',
      },
      {
        label: 'Sistema de diseño',
        src: '/projects/buy-sell/foundations-hd.webp',
        alt: 'Fundamentos del sistema de diseño de Buy&Sell',
      },
    ],
  },
  phases: [],
  ai: { tool: '', phase: '', humanInput: '', output: '', criteria: '', limits: '', decision: '' },
  figmaLayers: [],
  learnings: [],
  futureQuestion: '',
}

describe('CaseCard', () => {
  it('renders a branded visual preview for a published project', () => {
    const markup = renderToStaticMarkup(<CaseCard item={buySell} />)

    expect(markup).toContain('aria-label="Vista previa de Buy&amp;Sell Marketplace"')
    expect(markup).toContain('alt="Buy&amp;Sell"')
    expect(markup).toContain('aria-roledescription="carrusel"')
    expect(markup).toContain('rd-buy-sell-cover')
    expect(markup).toContain('Una identidad que se convierte en producto')
    expect(markup).toContain('data-pointer-cta="true"')
    expect(markup).toContain('Producto final')
    expect(markup).toContain('Sistema de diseño')
    expect(markup).toContain('Ver caso de estudio')
    expect(markup).toContain('Caso en evolución')
    expect(markup).toContain('Dirección UX/UI y sistema de diseño')
    expect(markup).toContain('rd-case-title-reveal')
    expect(markup).toContain('<article class="rd-case">')
    expect(markup).toContain('<h3 class="rd-case-title">')
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/CaseCard.tsx'), 'utf8')
    expect(source).toContain('new IntersectionObserver')
    expect(source).toContain('setTitleVisible(true)')
    expect(source).toContain('setTitleVisible(entry.isIntersecting)')
    expect(source).not.toContain('observer.disconnect()\n    },')
  })

  it('uses project-specific visual language instead of Buy&Sell copy', () => {
    const laliga = {
      ...buySell,
      slug: 'laliga-club-operations-hub',
      title: 'LaLiga ',
      titleAccent: 'Hub de Clubes',
      visual: {
        ...buySell.visual,
        theme: 'laliga',
        kicker: 'Operaciones de clubes',
        statement: 'Gobernanza documental para múltiples roles.',
      },
    } as unknown as CaseStudy

    const markup = renderToStaticMarkup(<CaseCard item={laliga} />)

    expect(markup).toContain('rd-case-visual--laliga')
    expect(markup).toContain('Operaciones de clubes')
    expect(markup).toContain('Gobernanza documental para múltiples roles.')
    expect(markup).not.toContain('Marketplace tecnológico')
    expect(markup).not.toContain('rd-buy-sell-cover')
  })

  it('uses a real editorial cover asset for the LALIGA preview', () => {
    const laliga = {
      ...buySell,
      slug: 'laliga-club-operations-hub',
      title: 'LALIGA ',
      titleAccent: 'Hub de Clubes',
      visual: {
        ...buySell.visual,
        theme: 'laliga',
        logoSrc: '/projects/laliga/logo-negative.svg',
        logoAlt: 'LALIGA · Hub de Clubes',
      },
    } as unknown as CaseStudy

    const markup = renderToStaticMarkup(<CaseCard item={laliga} />)

    expect(markup).toContain('%2Fprojects%2Flaliga%2Feditorial-cover-v1.webp')
    expect(markup).toContain('rd-project-cover--laliga')
  })

  it('uses a real editorial cover asset for the Coordination Hub preview', () => {
    const coordination = {
      ...buySell,
      slug: 'coordination-hub',
      title: 'Coordination ',
      titleAccent: 'Hub',
      visual: {
        ...buySell.visual,
        theme: 'coordination',
        logoSrc: '/projects/coordination-hub/logo.svg',
        logoAlt: 'Coordination Hub',
      },
    } as unknown as CaseStudy

    const markup = renderToStaticMarkup(<CaseCard item={coordination} />)

    expect(markup).toContain('%2Fprojects%2Fcoordination-hub%2Feditorial-cover-v1.webp')
    expect(markup).toContain('rd-project-cover--coordination')
  })

  it('exposes exclusive viewport activation to the preview sequence', () => {
    const markup = renderToStaticMarkup(<CaseCard item={buySell} viewportActive />)

    expect(markup).toContain('data-case-preview="buy-sell-marketplace"')
    expect(markup).toContain('data-viewport-active="true"')
  })

  it('introduces the project before its visual and removes duplicate metadata', () => {
    const markup = renderToStaticMarkup(<CaseCard item={buySell} />)

    expect(markup.indexOf('rd-case-caption')).toBeLessThan(markup.indexOf('rd-case-visual'))
    expect(markup).not.toContain('rd-case-index')
    expect(markup).not.toContain('rd-case-tags')
    expect(markup).not.toContain('rd-case-arrow')
  })

  it('adds a desktop-only editorial summary with project purpose and role', () => {
    const markup = renderToStaticMarkup(<CaseCard item={buySell} />)

    expect(markup).toContain('rd-case-visual-narrative')
    expect(markup).toContain('rd-case-visual-details')
    expect(markup).toContain('Del sistema de diseño al producto full stack.')
    expect(markup).toContain('UX/UI y desarrollo')
    expect(markup).toContain('rd-tech-stack')
    expect(markup).toContain('Figma')
    expect(markup).toContain('Angular')
  })
})
