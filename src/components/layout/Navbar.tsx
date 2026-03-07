'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { navItems } from '@/data/navigation'
import { useScrolled } from '@/hooks/useScrollProgress'
import { useTheme } from '@/hooks/useTheme'
import { ThemeToggle } from '@/components/ui'

export function Navbar() {
  const { toggle, isDark } = useTheme()
  const scrolled = useScrolled(24)
  const [activeSection, setActiveSection] = useState('')

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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 60,
        transition: 'all 0.25s ease',
        ...(scrolled
          ? {
              background: isDark ? 'rgba(8,8,10,0.78)' : 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            }
          : {
              background: 'transparent',
              borderBottom: '1px solid transparent',
            }),
      }}
    >
      <nav
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 28px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
        aria-label="Navegacion principal"
      >
        <Link
          href="/"
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text)',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          Manuel Garcia
        </Link>

        <ul
          role="list"
          style={{
            display: 'flex',
            gap: '24px',
            listStyle: 'none',
            alignItems: 'center',
          }}
        >
          {navItems.map((item) => {
            const isHash = item.href.startsWith('#')
            const isActive = isHash && activeSection === item.href.replace('#', '')

            return (
              <li key={item.href} className="hide-m">
                <Link
                  href={item.href}
                  style={{
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--text)' : 'var(--text-sec)',
                    textDecoration: 'none',
                    transition: 'color 0.15s ease',
                  }}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        <ThemeToggle isDark={isDark} onToggle={toggle} />
      </nav>
    </header>
  )
}
