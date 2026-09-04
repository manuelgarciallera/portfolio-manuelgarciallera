import { renderToStaticMarkup } from 'react-dom/server'
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { getCaseBySlug } from '../content/cases'
import { CasePage } from './CasePage'

describe('CasePage theme hydration', () => {
  it('renders the same dark theme control as the root layout on the server', () => {
    const study = getCaseBySlug('buy-sell-marketplace')!
    const markup = renderToStaticMarkup(<CasePage study={study} />)

    expect(markup).toContain('aria-label="Activar tema claro"')
  })

  it('uses a branded TheUXUnion scene in the project opening instead of repeating the round UX mark', () => {
    const study = getCaseBySlug('the-ux-union')!
    const markup = renderToStaticMarkup(<CasePage study={study} />)

    const featureStart = markup.indexOf('rd-case-feature--theuxunion')
    const featureEnd = markup.indexOf('rd-meta-grid', featureStart)
    const featureMarkup = markup.slice(featureStart, featureEnd)

    expect(featureMarkup).toContain('rd-case-feature-brand--theuxunion')
    expect(featureMarkup).toContain('visual-language-hd.webp')
    expect(featureMarkup).toContain('TheUXUnion')
    expect(featureMarkup).not.toContain('/projects/theuxunion/logo.svg')

    const css = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/redesign.css'), 'utf8')
    expect(css).toMatch(/\.rd-case-feature-brand--theuxunion\s*\{[^}]*width:\s*min\(100%,\s*28rem\)[^}]*aspect-ratio:\s*16\s*\/\s*10/)
    expect(css).toMatch(/\.rd-meta-grid \.rd-tech-stack\s*\{[^}]*margin-top:\s*\.7rem/)
    expect(css).toMatch(/\.rd-tech-stack__item:hover\s*\{[^}]*transform:\s*none/)
  })
})
