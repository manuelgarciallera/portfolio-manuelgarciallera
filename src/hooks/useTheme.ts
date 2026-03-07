'use client'
import { useState, useEffect } from 'react'
import type { Theme } from '@/types'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    const initial = saved || 'dark'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('theme', next)
  }

  return { theme, toggle, isDark: theme === 'dark' }
}
