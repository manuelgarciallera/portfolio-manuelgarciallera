import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { TechStack } from './TechStack'

describe('TechStack', () => {
  it('lets keyboard users enter the horizontally scrollable technology list', () => {
    const markup = renderToStaticMarkup(<TechStack technologies={['Figma', 'React']} compact />)

    expect(markup).toContain('aria-label="Stack tecnológico" tabindex="0"')
    expect(markup).toContain('Figma')
    expect(markup).toContain('React')
  })
})
