'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme }   from '@/hooks/useTheme'
import { useScrolled } from '@/hooks/useScrollProgress'
import { navItems }   from '@/data/navigation'

export function Navbar() {
  const { theme, toggle, isDark } = useTheme()
  const scrolled = useScrolled(50)
  const [activeSection, setActiveSection] = useState('')

  // Detecta la sección activa según scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { rootMargin: '-40% 0px -55% 0px' }
    )
    document.querySelectorAll('section[id]').forEach((sec) => observer.observe(sec))
    return () => observer.disconnect()
  }, [])

  return (
    <header
      role="banner"
      style={{
        position:   'fixed',
        top:        0,
        left:       0,
        right:      0,
        zIndex:     50,
        transition: 'all 0.3s ease',
        ...(scrolled
          ? {
              background:       'rgba(10,10,10,0.8)',
              backdropFilter:   'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderBottom:     '1px solid rgba(255,255,255,0.06)',
            }
          : { background: 'transparent', borderBottom: '1px solid transparent' }),
      }}
    >
      <nav
        style={{
          maxWidth:       '1200px',
          margin:         '0 auto',
          padding:        '0 28px',
          height:         '52px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
        }}
        aria-label="Navegación principal"
      >
        {/* Logo / nombre */}
        <Link
          href="/"
          style={{
            fontFamily:  "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
            fontSize:    '15px',
            fontWeight:  600,
            color:       'var(--text)',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
          }}
        >
          Manuel García
        </Link>

        {/* Links de navegación */}
        <ul
          role="list"
          style={{
            display:    'flex',
            gap:        '32px',
            listStyle:  'none',
            alignItems: 'center',
          }}
        >
          {navItems.map((item) => {
            const isActive = activeSection === item.href.replace('#', '')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  style={{
                    fontFamily:     "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
                    fontSize:       '13px',
                    fontWeight:     isActive ? 600 : 400,
                    color:          isActive ? 'var(--text)' : 'var(--text-sec)',
                    textDecoration: 'none',
                    transition:     'color 0.2s ease',
                  }}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
          style={{
            background:   'rgba(255,255,255,0.08)',
            border:       '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px',
            padding:      '6px 14px',
            cursor:       'pointer',
            fontSize:     '12px',
            color:        'var(--text-sec)',
            fontFamily:   "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
            transition:   'all 0.2s ease',
            whiteSpace:   'nowrap',
          }}
        >
          {isDark ? '☀ Claro' : '◑ Oscuro'}
        </button>
      </nav>
    </header>
  )
}
