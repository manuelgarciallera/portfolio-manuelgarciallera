import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { CaseVisual } from '../content/types'
import { ProjectEditorialCover } from './ProjectEditorialCover'

const createVisual = (theme: CaseVisual['theme']): CaseVisual => ({
  theme,
  logoSrc: `/projects/${theme}/logo.svg`,
  logoAlt: `${theme} logo`,
  kicker: 'Decorative metadata that must not appear on the cover',
  statement: 'Supporting copy that must not appear on the cover.',
  slides: [{ label: 'Vista', src: '/projects/example.webp', alt: 'Vista' }],
})

describe('ProjectEditorialCover', () => {
  it.each(['laliga', 'coordination'] as const)('keeps the %s cover to artwork and logo only', (theme) => {
    const markup = renderToStaticMarkup(<ProjectEditorialCover index="02" visual={createVisual(theme)} />)

    expect(markup).toContain(`rd-project-cover--${theme}`)
    expect(markup).toContain('rd-project-cover__logo')
    expect(markup).not.toContain('rd-project-cover__lockup')
    expect(markup).not.toContain('Decorative metadata')
    expect(markup).not.toContain('Supporting copy')
    expect(markup).not.toContain('02 / Selección')
  })

  it('builds TheUXUnion cover from three independent 3D artifacts and its real logo', () => {
    const markup = renderToStaticMarkup(<ProjectEditorialCover index="04" visual={createVisual('theuxunion')} />)

    expect(markup).toContain('rd-project-cover--theuxunion')
    expect(markup).toContain('%2Fprojects%2Ftheuxunion%2Fbrand-hd.webp')
    expect(markup).toContain('%2Fprojects%2Ftheuxunion%2Fcover-ribbon-v1.webp')
    expect(markup).toContain('%2Fprojects%2Ftheuxunion%2Fcover-polyhedron-v1.webp')
    expect(markup.match(/class="rd-project-cover__artifact /g)).toHaveLength(3)
    expect(markup).toContain('/projects/theuxunion/logo.svg')
    expect(markup).not.toContain('Decorative metadata')
    expect(markup).not.toContain('Supporting copy')
  })
})
