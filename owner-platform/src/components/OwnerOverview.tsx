'use client'

import { useEffect, useState } from 'react'

import { presentOwnerDashboard } from '@/dashboard/presentation'
import styles from './OwnerOverview.module.css'

type View = ReturnType<typeof presentOwnerDashboard>

export const OwnerOverview = () => {
  const [view, setView] = useState<View | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      try {
        const response = await fetch('/api/owner/dashboard', { credentials: 'same-origin', signal: controller.signal })
        const data = await response.json() as { overview?: unknown }
        if (!response.ok || !data.overview) throw new Error('Dashboard unavailable')
        setView(presentOwnerDashboard(data.overview))
      } catch (reason) {
        if (!(reason instanceof DOMException && reason.name === 'AbortError')) setError(true)
      }
    }
    void load()
    return () => controller.abort()
  }, [])

  if (error) return <p className={styles.notice} role="status">El resumen no está disponible. Las colecciones siguen accesibles debajo.</p>
  if (!view) return <p className={styles.notice} role="status">Preparando resumen…</p>

  return (
    <section className={styles.overview} aria-labelledby="owner-overview-title">
      <div className={styles.heading}>
        <h2 id="owner-overview-title">Estado editorial</h2>
        <span>{view.runtimeLabel}</span>
      </div>
      <nav className={styles.actions} aria-label="Crear contenido">
        {view.actions.map((action) => <a href={action.href} key={action.href}>{action.label}</a>)}
      </nav>
      <ul className={styles.metrics}>
        {view.cards.map((card) => (
          <li key={card.label} data-tone={card.tone}>
            <a href={card.href}><strong>{card.value}</strong><span>{card.label}</span></a>
          </li>
        ))}
      </ul>
      {view.recent.length > 0 && (
        <div className={styles.recent}>
          <h3>Continuar editando</h3>
          <ul>
            {view.recent.map((item) => (
              <li key={item.href}>
                <a href={item.href}><span>{item.label}</span><small>{item.meta}</small></a>
                <time dateTime={item.updatedAt}>{new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(new Date(item.updatedAt))}</time>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
