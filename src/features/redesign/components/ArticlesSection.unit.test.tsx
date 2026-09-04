import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ArticleCover, ArticlesSection } from './ArticlesSection'

describe('ArticleCover', () => {
  it('starts inactive and observes its own viewport entry on every layout', () => {
    const markup = renderToStaticMarkup(<ArticleCover theme="material" index="01" />)
    const source = fs.readFileSync(path.join(process.cwd(), 'src/features/redesign/components/ArticlesSection.tsx'), 'utf8')

    expect(markup).toContain('data-active="false"')
    expect(source).toContain('new IntersectionObserver')
    expect(source).toContain("rootMargin: '10% 0px'")
    expect(source).not.toContain('matchMedia')
  })
})

describe('ArticlesSection', () => {
  it('identifies the section as blog, research and practice with a circular separator', () => {
    const markup = renderToStaticMarkup(<ArticlesSection />)

    expect(markup).toContain('BLOG <span aria-hidden="true">●</span> INVESTIGACIÓN Y PRÁCTICA')
  })
})
