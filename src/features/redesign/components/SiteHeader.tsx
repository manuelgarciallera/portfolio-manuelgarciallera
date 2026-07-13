'use client'

import { useEffect, useState } from 'react'

interface SiteHeaderProps {
  isDark: boolean
  onToggleTheme: () => void
}

/** Regla de Manuel: sin navbar arriba; aparece solo al hacer scroll,
 *  con blur y contraste AA garantizado en ambos temas. */
export function SiteHeader({ isDark, onToggleTheme }: SiteHeaderProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`rd-header${visible ? ' is-visible' : ''}`}>
      <a className="rd-brand" href="#inicio">
        Manuel García-Llera <em>/ AI Design Engineer</em>
      </a>
      <nav className="rd-nav" aria-label="Principal">
        <a href="#enfoque">Enfoque</a>
        <a href="#capacidades">Capacidades</a>
        <a href="#casos">Casos</a>
        <a href="#contacto">Contacto</a>
        <button type="button" className="rd-theme-btn" onClick={onToggleTheme}>
          {isDark ? 'Luz' : 'Noche'}
        </button>
      </nav>
    </header>
  )
}
