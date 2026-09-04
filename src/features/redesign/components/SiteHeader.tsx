'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment, useEffect, useRef, useState } from 'react'
import { PROFILE_LINKS } from '../../../lib/site-config'
import '../responsive.css'

const NAV_ITEMS = [
  { href: '/casos', label: 'Proyectos' },
  { href: '/#investigacion', label: 'Investigación' },
  { href: '/proceso', label: 'Proceso' },
  { href: '/sobre-mi', label: 'Sobre mí' },
  { href: '/articulos', label: 'Blog' },
] as const

interface SiteHeaderProps {
  isDark: boolean
  onToggleTheme: () => void
  /** Conservado para las páginas interiores: todas arrancan orientadas y visibles. */
  forceVisible?: boolean
}

/** La barra aparece al subir o volver al inicio y se retira al bajar. */
export function SiteHeader({ isDark, onToggleTheme, forceVisible = false }: SiteHeaderProps) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const [compact, setCompact] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileNavRef = useRef<HTMLElement>(null)
  const scrollAnchorRef = useRef(0)

  useEffect(() => {
    const onScroll = () => {
      const currentY = Math.max(window.scrollY, 0)
      const delta = currentY - scrollAnchorRef.current
      const atTop = currentY < 32

      setCompact(currentY > 44)
      if (atTop || forceVisible && currentY === 0) setVisible(true)
      else if (Math.abs(delta) >= 8) setVisible(delta < 0)

      if (Math.abs(delta) >= 8 || atTop) scrollAnchorRef.current = currentY
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [forceVisible])

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = Array.from(mobileNavRef.current?.querySelectorAll<HTMLElement>('a, button') ?? [])
    focusable[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
        return
      }
      if (event.key !== 'Tab' || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)
  const isCurrentPage = (href: string) => {
    if (href.includes('#')) return false
    return pathname === href || (href !== '/' && (pathname ?? '').startsWith(`${href}/`))
  }
  const themeLabel = isDark ? 'Activar tema claro' : 'Activar tema oscuro'
  const themeIcon = isDark ? (
    <svg className="rd-theme-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5" /><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" /></svg>
  ) : (
    <svg className="rd-theme-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z" /></svg>
  )

  return (
    <Fragment>
    <a className="rd-skip-link" href="#main-content">Saltar al contenido</a>
    <header data-scroll-behavior="reveal-up" className={`rd-header${visible || menuOpen ? ' is-visible' : ''}${compact ? ' is-compact' : ''}${menuOpen ? ' menu-open' : ''}`}>
      <Link className="rd-brand" href="/" aria-label="Manuel García-Llera / Product Designer · Design Engineer">
        <span className="rd-brand-wordmark">Manuel García-Llera <em>/ Product Designer · Design Engineer</em></span>
        <span className="rd-brand-monogram" aria-hidden="true">MG</span>
      </Link>
      <nav className="rd-nav rd-desktop-nav" aria-label="Principal">
        {NAV_ITEMS.map((item) => (
          <Link href={item.href} key={item.href} aria-current={isCurrentPage(item.href) ? 'page' : undefined}>{item.label}</Link>
        ))}
        <a href={PROFILE_LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
        <Link className="rd-nav-contact rd-desktop-contact" href="/#contacto">Contacto</Link>
        <button type="button" className="rd-theme-btn" aria-label={themeLabel} title={themeLabel} onClick={onToggleTheme}>
          {themeIcon}
        </button>
      </nav>

      <Link className="rd-nav-contact rd-mobile-contact" href="/#contacto" onClick={closeMenu}>Contacto</Link>

      <button
        ref={menuButtonRef}
        type="button"
        className="rd-menu-btn"
        aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
      </button>

      <nav
        ref={mobileNavRef}
        className="rd-mobile-nav"
        id="mobile-navigation"
        aria-label="Principal móvil"
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="rd-mobile-nav-links">
          {NAV_ITEMS.map((item) => (
            <Link href={item.href} key={item.href} aria-current={isCurrentPage(item.href) ? 'page' : undefined} onClick={closeMenu}>{item.label}</Link>
          ))}
          <a href={PROFILE_LINKS.linkedin} target="_blank" rel="noreferrer" onClick={closeMenu}>LinkedIn ↗</a>
          <Link className="rd-mobile-nav-contact" href="/#contacto" onClick={closeMenu}>Contacto</Link>
        </div>
        <button type="button" className="rd-theme-btn" aria-label={themeLabel} title={themeLabel} onClick={onToggleTheme}>
          {themeIcon}
        </button>
      </nav>
    </header>
    </Fragment>
  )
}
