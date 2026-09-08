import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { NUDE_PROJECT } from './content'
import { NudeProjectCover } from './NudeProjectCover'
import { getPublishedCases } from '../content/cases'

describe('NudeProject evidence', () => {
  it('is the last published case and explicitly a design prototype', () => {
    expect(getPublishedCases().at(-1)?.slug).toBe('nude-project')
    expect(NUDE_PROJECT.delivery).toBe('design-prototype')
    expect(NUDE_PROJECT.visual?.theme).toBe('nude-project')
  })
  it('does not represent the academic design as a developed store', () => {
    expect(NUDE_PROJECT.stack).toEqual(['Figma', 'Adobe CC'])
    expect(NUDE_PROJECT.codeEvidence).toBeUndefined()
    expect(NUDE_PROJECT.disclosure).toMatch(/académic/i)
    expect(NUDE_PROJECT.disclosure).toMatch(/no.*producción/i)
    expect(NUDE_PROJECT.phases.some(({ id }) => id === 'ia')).toBe(false)
    expect(NUDE_PROJECT.links?.every(({ href }) => href.startsWith('https://www.figma.com/'))).toBe(true)
  })
  it('ships real local media for all case evidence', () => {
    expect(NUDE_PROJECT.visual?.slides.length).toBeGreaterThanOrEqual(4)
    for (const slide of NUDE_PROJECT.visual?.slides ?? []) {
      expect(existsSync(`public${slide.src}`)).toBe(true)
      expect(slide.alt.length).toBeGreaterThan(15)
    }
  })
  it('renders photographic artwork and the original wordmark without extra image text', () => {
    const html = renderToStaticMarkup(<NudeProjectCover />)
    expect(html).toContain('editorial-photo.webp')
    expect(html).toContain('logo.svg')
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain('priority')
  })
})
