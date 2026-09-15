import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { TechStack } from './TechStack'
import { CASES } from '../content/cases'
import { siOpenaigym } from 'simple-icons'

describe('TechStack', () => {
  it('renders an icon for every named product in the project stacks', () => {
    const products = [...new Set(CASES.flatMap((study) => study.stack))]
      .filter((name) => !['3D', 'Tiempo real'].includes(name))
    for (const name of products) {
      const markup = renderToStaticMarkup(<TechStack technologies={[name]} compact />)
      expect(markup, name).toContain('<svg')
      expect(markup, name).toContain('aria-hidden="true"')
      expect(markup, name).toContain(name)
    }
  })

  it('uses the OpenAI brand rather than the unrelated Gym product', () => {
    const markup = renderToStaticMarkup(<TechStack technologies={['OpenAI/Codex']} />)
    expect(markup).toContain('<svg')
    expect(markup).not.toContain(siOpenaigym.path)
  })

  it('keeps informational technologies readable without inert keyboard stops or controls', () => {
    const markup = renderToStaticMarkup(<TechStack technologies={['Figma', 'React']} compact />)

    expect(markup).toContain('aria-label="Stack tecnológico"')
    expect(markup).not.toContain('tabindex=')
    expect(markup).not.toContain('<button')
    expect(markup).not.toContain('<a ')
    expect(markup).toContain('Figma')
    expect(markup).toContain('React')
  })
})
