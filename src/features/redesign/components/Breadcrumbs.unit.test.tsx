import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Breadcrumbs } from './Breadcrumbs'

describe('Breadcrumbs', () => {
  it('exposes a short semantic trail and marks the current page', () => {
    const markup = renderToStaticMarkup(
      <Breadcrumbs
        items={[
          { href: '/casos', label: 'Proyectos' },
          { label: 'Buy&Sell Marketplace' },
        ]}
      />,
    )

    expect(markup).toContain('aria-label="Migas de pan"')
    expect(markup).toContain('href="/"')
    expect(markup).toContain('href="/casos"')
    expect(markup).toContain('aria-current="page"')
    expect(markup).toContain('Buy&amp;Sell Marketplace')
  })
})
