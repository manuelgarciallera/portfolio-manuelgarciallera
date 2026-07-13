'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

interface SiteHeaderProps {
  isDark: boolean
  onToggleTheme: () => void
  /** En páginas interiores (casos) el header es visible desde el inicio. */
  forceVisible?: boolean
}

/** Regla de Manuel: sin navbar arriba en la home; aparece solo al hacer scroll,
 *  con blur y contraste AA garantizado en ambos temas. */
export function SiteHeader({ isDark, onToggleTheme, forceVisible = false }: SiteHeaderProps) {
  const [visible, setVisible] = useState(forceVisible)

  useEffect(() => {
    if (forceVisible) return
    const onScroll = () => setVisible(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [forceVisible])

  return (
    <header className={`rd-header${visible ? ' is-visible' : ''}`}>
      <Link className="rd-brand" href="/">
        Manuel García-Llera <em>/ AI Design Engineer</em>
      </Link>
      <nav className="rd-nav" aria-label="Principal">
        <Link href="/#enfoque">Enfoque</Link>
        <Link href="/#capacidades">Capacidades</Link>
        <Link href="/casos">Casos</Link>
        <Link href="/#contacto">Contacto</Link>
        <button type="button" className="rd-theme-btn" onClick={onToggleTheme}>
          {isDark ? 'Luz' : 'Noche'}
        </button>
      </nav>
    </header>
  )
}
