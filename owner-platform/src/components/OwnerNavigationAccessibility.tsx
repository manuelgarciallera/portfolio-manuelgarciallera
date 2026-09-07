'use client'

import { useNav } from '@payloadcms/ui'
import { useEffect } from 'react'

// Payload supplies the navigation and state. This small adapter completes the
// mobile dialog contract without copying its permission-aware menu or template.
// Keep the browser characterization test when upgrading Payload's DOM contract.
export const OwnerNavigationAccessibility = () => {
  const { hydrated, navOpen, navRef, setNavOpen } = useNav()

  useEffect(() => {
    if (!hydrated) return
    const nav = navRef.current?.closest<HTMLElement>('aside.nav')
    const shell = nav?.closest('.template-default')
    const wrap = shell?.querySelector<HTMLElement>('.template-default__wrap')
    const opener = wrap?.querySelector<HTMLButtonElement>('.app-header__mobile-nav-toggler')
    const close = nav?.querySelector<HTMLButtonElement>('.nav__mobile-close')
    if (!nav || !wrap || !opener || !close) return

    const mobile = window.matchMedia('(max-width: 768px)')
    const focusVisibleToggle = () => {
      const target = mobile.matches ? opener : shell?.parentElement?.querySelector<HTMLButtonElement>('.template-default__nav-toggler')
      if (target?.isConnected && target.getClientRects().length > 0) target.focus({ preventScroll: true })
    }
    let release: (() => void) | undefined
    const apply = () => {
      release?.()
      release = undefined
      if (!mobile.matches) return

      const attributes: [Element, string, string | null][] = []
      const set = (el: Element, key: string, value: string) => {
        attributes.push([el, key, el.getAttribute(key)])
        el.setAttribute(key, value)
      }
      set(nav, 'id', 'owner-mobile-navigation')
      set(opener, 'tabindex', '0')
      set(opener, 'aria-controls', nav.id)
      set(opener, 'aria-expanded', String(navOpen))
      set(close, 'aria-label', 'Cerrar menú')

      const wasInert = wrap.inert
      const overflow = document.body.style.overflow
      const tabbable = () => Array.from(nav.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]'))
        .filter(el => el.tabIndex >= 0 && !el.matches(':disabled') && !el.closest('[inert]') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden')
      const keydown = (event: KeyboardEvent) => {
        if (event.defaultPrevented) return
        if (event.key === 'Escape') {
          event.preventDefault()
          setNavOpen(false)
        } else if (event.key === 'Tab') {
          const controls = tabbable()
          const first = controls[0] ?? close
          const last = controls.at(-1) ?? close
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }
      }
      if (navOpen) {
        set(nav, 'role', 'dialog')
        set(nav, 'aria-label', 'Navegación principal')
        set(nav, 'aria-modal', 'true')
        wrap.inert = true
        document.body.style.overflow = 'hidden'
        close.focus({ preventScroll: true })
        nav.addEventListener('keydown', keydown)
      }
      release = () => {
        nav.removeEventListener('keydown', keydown)
        if (navOpen) {
          wrap.inert = wasInert
          document.body.style.overflow = overflow
          focusVisibleToggle()
        }
        for (const [el, key, value] of attributes.reverse()) {
          if (value === null) el.removeAttribute(key)
          else el.setAttribute(key, value)
        }
      }
    }
    const resize = () => {
      const active = document.activeElement
      const focusWasInNavigation = active instanceof Element && (nav.contains(active) || active.matches('.app-header__mobile-nav-toggler, .template-default__nav-toggler'))
      apply()
      if (focusWasInNavigation) focusVisibleToggle()
    }
    apply()
    mobile.addEventListener('change', resize)
    return () => {
      mobile.removeEventListener('change', resize)
      release?.()
    }
  }, [hydrated, navOpen, navRef, setNavOpen])

  return null
}
