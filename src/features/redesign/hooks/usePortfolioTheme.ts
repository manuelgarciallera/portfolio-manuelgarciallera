'use client'

import { useCallback, useEffect, useState } from 'react'

export function usePortfolioTheme(): [boolean, () => void] {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const nextIsDark = window.localStorage.getItem('rd-theme') !== 'light'
    document.documentElement.dataset.theme = nextIsDark ? 'dark' : 'light'
    const frame = window.requestAnimationFrame(() => setIsDark(nextIsDark))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const toggleTheme = useCallback(() => {
    setIsDark((current) => {
      const next = !current
      document.documentElement.dataset.theme = next ? 'dark' : 'light'
      window.localStorage.setItem('rd-theme', next ? 'dark' : 'light')
      return next
    })
  }, [])

  return [isDark, toggleTheme]
}
