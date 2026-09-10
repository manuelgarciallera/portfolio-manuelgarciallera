'use client'

import { useEffect, useState } from 'react'

const STEPS = [
  ['opening', 'Identidad'],
  ['context', 'Contexto'],
  ['system', 'Sistema'],
  ['journey', 'Producto'],
] as const

export function CasePreludeProgress() {
  const [active, setActive] = useState('opening')

  useEffect(() => {
    const sections = STEPS.map(([id]) => document.querySelector(`[data-story-step="${id}"]`)).filter(Boolean)
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target instanceof HTMLElement) setActive(visible.target.dataset.storyStep ?? 'opening')
      },
      { rootMargin: '-30% 0px -55%', threshold: [0.05, 0.35, 0.7] },
    )
    sections.forEach((section) => observer.observe(section!))
    return () => observer.disconnect()
  }, [])

  return (
    <nav className="rd-prelude-progress" aria-label="Recorrido del preámbulo">
      <span className="rd-prelude-progress__title">Buy&amp;Sell / preámbulo</span>
      <ol>
        {STEPS.map(([id, label], index) => (
          <li key={id} className={active === id ? 'is-active' : undefined}>
            <a href={id === 'opening' ? '#historia-opening' : `#historia-${id}`}>
              <span>{String(index + 1).padStart(2, '0')}</span>{label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
