'use client'

import Link from 'next/link'
import { BrandSignature } from './BrandSignature'
import { ContactLink } from './ContactLink'
import { usePathname } from 'next/navigation'
import { Fragment, useEffect, useRef, useState } from 'react'
import { PERSON_DISPLAY_NAME, PROFILE_LINKS } from '../../../lib/site-config'
import { PUBLIC_ROUTES } from '../../../lib/public-routes'
import { CvDownloads } from '../about/CvDownloads'
import '../responsive.css'
import './mobile-cv.css'
import './action-feedback.css'
import './header-controls.css'
import { actionFeedback } from './action-feedback'

const NAV_ITEMS = [
  { href: PUBLIC_ROUTES.projects, label: 'Proyectos' },
  { href: '/investigacion', label: 'Investigación' },
  { href: '/proceso', label: 'Proceso' },
  { href: '/sobre-mi', label: 'Sobre mí' },
  { href: PUBLIC_ROUTES.blog, label: 'Blog' },
] as const

const MOBILE_NAV_ITEMS = [{ href: '/', label: 'Inicio' }, ...NAV_ITEMS] as const

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
  const [focusWithin, setFocusWithin] = useState(false)
  const brandRef = useRef<HTMLAnchorElement>(null)
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
    const desktop = window.matchMedia('(min-width: 1180px)')
    const onBreakpoint = (event: MediaQueryListEvent) => {
      const active = document.activeElement
      if (event.matches) {
        const leavingMobileControl = active === menuButtonRef.current || mobileNavRef.current?.contains(active)
        setMenuOpen(false)
        if (leavingMobileControl) brandRef.current?.focus({ preventScroll: true })
      } else if (active instanceof HTMLElement && active.closest('.rd-desktop-nav')) {
        menuButtonRef.current?.focus({ preventScroll: true })
      }
    }
    desktop.addEventListener('change', onBreakpoint)
    return () => desktop.removeEventListener('change', onBreakpoint)
  }, [])

  useEffect(() => {
    if (!menuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const getFocusable = () => [menuButtonRef.current, ...Array.from(mobileNavRef.current?.querySelectorAll<HTMLElement>('a, button, summary') ?? [])]
      .filter((element): element is HTMLElement => Boolean(element && element.getClientRects().length > 0))
    mobileNavRef.current?.querySelector<HTMLElement>('a')?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) return
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
    <header data-scroll-behavior="reveal-up" className={`rd-header${visible || menuOpen || focusWithin ? ' is-visible' : ''}${compact ? ' is-compact' : ''}${menuOpen ? ' menu-open' : ''}`}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={event => {
        if (event.currentTarget.contains(event.relatedTarget)) return
        // Chromium can blur a newly hidden desktop link before the media event.
        if (event.relatedTarget === null && event.target.closest('.rd-desktop-nav') && window.matchMedia('(max-width: 1179px)').matches) {
          menuButtonRef.current?.focus({ preventScroll: true })
        } else setFocusWithin(false)
      }}>
      <Link ref={brandRef} className="rd-brand" href="/" aria-label={`${PERSON_DISPLAY_NAME} / Product Designer · Design Engineer`} onNavigate={(event) => {
        closeMenu()
        if (pathname === '/') {
          event.preventDefault()
          // Next preserves scroll on the current route. A home mark must also return to its start.
          requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }))
        }
      }}>
        <span className="rd-brand-wordmark">{PERSON_DISPLAY_NAME} <em>/ Product Designer · Design Engineer</em></span>
        <span className="rd-brand-monogram" aria-hidden="true"><BrandSignature /></span>
      </Link>
      <nav className="rd-nav rd-desktop-nav" aria-label="Principal">
        {NAV_ITEMS.map((item) => (
          <Link href={item.href} key={item.href} aria-current={isCurrentPage(item.href) ? 'page' : undefined}>{item.label}</Link>
        ))}
        <a href={PROFILE_LINKS.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>
        <ContactLink className="rd-nav-contact rd-desktop-contact">Contacto</ContactLink>
        <button type="button" className="rd-theme-btn" aria-label={themeLabel} title={themeLabel} onClick={onToggleTheme}>
          {themeIcon}
        </button>
      </nav>

      <ContactLink className="rd-nav-contact rd-mobile-contact" onClick={closeMenu}>Contacto</ContactLink>

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
          {MOBILE_NAV_ITEMS.map((item) => (
            <Link href={item.href} key={item.href} aria-current={isCurrentPage(item.href) ? 'page' : undefined} onClick={closeMenu}
              onNavigate={(event) => {
                if (item.href === '/' && pathname === '/') {
                  event.preventDefault()
                  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }))
                }
              }}>{item.label}</Link>
          ))}
          <a href={PROFILE_LINKS.linkedin} target="_blank" rel="noreferrer" onClick={closeMenu}>LinkedIn ↗</a>
          <ContactLink {...actionFeedback} className="rd-mobile-nav-contact rd-action-feedback" onClick={closeMenu}>
            <span className="rd-cta-glow" aria-hidden="true" />
            Contacto
          </ContactLink>
        </div>
        <div className="rd-mobile-nav-utilities">
          <CvDownloads />
          <button type="button" className="rd-theme-btn" aria-label={themeLabel} title={themeLabel} onClick={onToggleTheme}>
            {themeIcon}
          </button>
        </div>
      </nav>
    </header>
    </Fragment>
  )
}
