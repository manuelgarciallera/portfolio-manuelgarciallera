import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProjectEvidenceImage } from './ProjectEvidenceImage'
import { ImageConfigContext } from 'next/dist/shared/lib/image-config-context.shared-runtime'
import { imageConfigDefault } from 'next/dist/shared/lib/image-config'
import nextConfig from '../../../../next.config'
import sharp from 'sharp'
import path from 'node:path'
import { getPublishedCases } from '../content/cases'
import { projectImageDimensions } from './projectImageDimensions'

describe('ProjectEvidenceImage', () => {
  it('reserves dimensions matching every actual published evidence asset', async () => {
    const sources = new Set(getPublishedCases().flatMap(study => [
      ...(study.visual?.slides.filter(slide => slide.kind !== 'coordination-diagram').map(slide => slide.src) ?? []),
      ...(study.story?.flatMap(block => block.image ? [block.image.src] : []) ?? []),
    ]))
    for (const src of sources) {
      const metadata = await sharp(path.join(process.cwd(), 'public', src)).metadata()
      expect(projectImageDimensions[src], src).toEqual([metadata.width, metadata.height])
    }
  })
  it('reserves the actual portrait ratio, not a landscape placeholder, and exposes a keyboard link to the original', () => {
    const html = renderToStaticMarkup(<ProjectEvidenceImage src="/projects/laliga/club-mobile-hd.webp" alt="Panel móvil de clubes" sizes="320px" />)
    expect(html).toContain('width="390" height="843"')
    expect(html).toContain('href="/projects/laliga/club-mobile-hd.webp"')
    expect(html).toContain('aria-label="Ampliar imagen: Panel móvil de clubes"')
    expect(html).toContain('data-portrait="true"')
  })
  it('keeps the real landscape ratio and high-quality responsive variants', () => {
    const html = renderToStaticMarkup(<ImageConfigContext.Provider value={{ ...imageConfigDefault, qualities: nextConfig.images?.qualities }}><ProjectEvidenceImage src="/projects/buy-sell/figma-brand-navigation-hd.webp" alt="Sistema de diseño" sizes="60vw" /></ImageConfigContext.Provider>)
    expect(html).toContain('width="3200" height="2331"')
    expect(html).toContain('sizes="60vw"')
    expect(html).toContain('q=92')
    expect(html).toContain('data-portrait="false"')
  })
})
