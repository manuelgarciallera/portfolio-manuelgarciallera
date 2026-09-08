import path from 'node:path'

import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { getCaseBySlug, getPublishedCases } from './cases'

describe('portfolio case catalogue', () => {
  it('publishes LaLiga as an evolving synthetic-data case without private links', () => {
    const study = getCaseBySlug('laliga-club-operations-hub')

    expect(study?.published).toBe(true)
    expect(study?.status).toBe('evolving')
    expect(study?.disclosure?.toLowerCase()).toContain('datos sintéticos')
    expect(study?.visual?.slides.length).toBeGreaterThanOrEqual(4)

    const unsafeLink = study?.links?.find(({ href }) => /localhost|preview|@|github\.com/i.test(href))
    expect(unsafeLink).toBeUndefined()
  })

  it('keeps the established projects in order with the academic NudeProject case last', () => {
    expect(getPublishedCases().map(({ slug }) => slug)).toEqual([
      'buy-sell-marketplace',
      'laliga-club-operations-hub',
      'coordination-hub',
      'the-ux-union',
      'nude-project',
    ])
  })

  it('gives recruiters three scannable and evidence-based signals per published case', () => {
    for (const study of getPublishedCases()) {
      expect(study.proofPoints).toHaveLength(3)
      expect(study.proofPoints?.every(({ value, label }) => value.trim() && label.trim())).toBe(true)
    }
  })

  it('gives Buy&Sell an ordered visual story from brand matter to implemented product', () => {
    const study = getCaseBySlug('buy-sell-marketplace')

    expect(study?.story?.map(({ id }) => id)).toEqual([
      'opening',
      'context',
      'system',
      'journey',
      'implementation',
    ])
    expect(study?.story?.at(-1)?.links?.map(({ kind }) => kind)).toEqual(['product', 'figma'])
    expect(study?.visual?.slides.map(({ label }) => label)).toEqual([
      'Fundamentos',
      'Componentes',
      'Experiencia',
      'Producto final',
    ])
    expect(study?.visual?.slides.slice(0, 2).map(({ src }) => src)).toEqual([
      '/projects/buy-sell/figma-brand-navigation-hd.webp',
      '/projects/buy-sell/figma-list-states-hd.webp',
    ])
    expect(study?.visual?.statement).toBe('Diseño, producto y sistema full stack. De la investigación al código.')
  })

  it('uses the approved technology stack for every published case', () => {
    expect(getCaseBySlug('buy-sell-marketplace')?.stack).toEqual(['Figma', 'Angular', 'Node.js', 'Express', 'Bootstrap', 'MySQL', 'Next.js'])
    expect(getCaseBySlug('laliga-club-operations-hub')?.stack).toEqual(['Figma', 'React', 'Next.js', 'TypeScript', 'Tailwind CSS'])
    expect(getCaseBySlug('coordination-hub')?.stack).toEqual(['Node.js', 'MCP', 'JSONL', 'Zod', 'Claude', 'OpenAI/Codex'])
    expect(getCaseBySlug('the-ux-union')?.stack).toEqual(['Figma', 'React', 'Next.js', 'TypeScript', 'Tailwind CSS'])
  })

  it('presents TheUXUnion as a single brand name with mobile, system, desktop and pitch evidence', () => {
    const study = getCaseBySlug('the-ux-union')

    expect(study?.published).toBe(true)
    expect(`${study?.title}${study?.titleAccent}`).toBe('TheUXUnion')
    expect(study?.summary.toLowerCase()).toContain('mvp')
    expect(study?.visual?.slides.map(({ label }) => label)).toEqual([
      'Mobile · Descubrir',
      'Mobile · Nodos',
      'Sistema · Identidad',
      'Sistema · Componentes',
      'Desktop implementado',
      'Pitch · Nodos',
    ])
    expect(study?.visual?.slides).toHaveLength(6)
    expect(study?.visual?.slides.map(({ src }) => src)).toEqual([
      '/projects/theuxunion/mobile-discover-figma-hd.webp',
      '/projects/theuxunion/mobile-nodes-figma-hd.webp',
      '/projects/theuxunion/design-system-foundations-figma-hd.webp',
      '/projects/theuxunion/design-system-components-figma-hd.webp',
      '/projects/theuxunion/mvp-implemented-hd.webp',
      '/projects/theuxunion/pitch-nodes-figma-hd.webp',
    ])
    expect(study?.visual?.slides.map(({ fit }) => fit)).toEqual([
      'contain',
      'contain',
      undefined,
      undefined,
      undefined,
      undefined,
    ])
    expect(study?.links?.some(({ href }) => href === 'https://manuelgarciallera.github.io/theuxunion/')).toBe(true)
  })

  it('serves the implemented TheUXUnion desktop capture at retina resolution', async () => {
    const metadata = await sharp(path.join(process.cwd(), 'public/projects/theuxunion/mvp-implemented-hd.webp')).metadata()

    expect(metadata.width).toBeGreaterThanOrEqual(2500)
    expect(metadata.height).toBeGreaterThanOrEqual(1400)
  })
})
