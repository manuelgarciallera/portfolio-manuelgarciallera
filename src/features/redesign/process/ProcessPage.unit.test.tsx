import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ProcessPage } from './ProcessPage'

describe('process phase illustrations', () => {
  it('places one lazy decorative image before the number of every phase', () => {
    const html = renderToStaticMarkup(<ProcessPage />)
    const cards = html.match(/<article\b[^>]*>[\s\S]*?<\/article>/g) ?? []
    const phases = cards.filter(card => card.includes('rd-case-index'))
    expect(phases).toHaveLength(6)
    for (const phase of phases) {
      expect(phase).toContain('rd-process-image')
      expect(phase.indexOf('<img')).toBeLessThan(phase.indexOf('rd-case-index'))
      expect(phase).toContain('loading="lazy"')
      expect(phase).toContain('alt=""')
    }
  })
})
