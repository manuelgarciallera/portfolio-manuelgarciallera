import { usePathname } from 'next/navigation'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContactLink } from './ContactLink'

vi.mock('next/navigation', () => ({ usePathname: vi.fn() }))
afterEach(() => vi.resetAllMocks())

describe('ContactLink', () => {
  it('uses a native fragment link on home and preserves menu/appearance props', () => {
    vi.mocked(usePathname).mockReturnValue('/')
    const closeMenu = vi.fn()
    const link = ContactLink({ children: 'Contacto', onClick: closeMenu, className: 'contact-cta' })

    expect(link.type).toBe('a')
    expect(link.props.href).toBe('#contacto')
    expect(link.props.onClick).toBe(closeMenu)
    expect(link.props.className).toBe('contact-cta')
  })

  it.each(['/sobre-mi', '/proyectos/coordination-hub', '/blog'])('uses a single native document-and-fragment navigation from %s', (pathname) => {
    vi.mocked(usePathname).mockReturnValue(pathname)
    const link = ContactLink({ children: 'Contacto' })

    expect(link.type).toBe('a')
    expect(link.props.href).toBe('/#contacto')
  })
})
