'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { presentOwnerDashboard } from '@/dashboard/presentation'
import styles from './OwnerOverview.module.css'
import { PublicationPreparation } from './PublicationPreparation'
import { ReleaseRegistration } from './ReleaseRegistration'
import { RestorePreparation } from './RestorePreparation'
import { SnapshotCapture } from './SnapshotCapture'
import { AssistancePreparation } from './AssistancePreparation'

type View = ReturnType<typeof presentOwnerDashboard>

export const OwnerOverview = () => {
  const [view, setView] = useState<View | null>(null)
  const [error, setError] = useState(false)
  const [snapshotRevision, setSnapshotRevision] = useState(0)

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
      <PublicationPreparation />
      <SnapshotCapture onCaptured={() => setSnapshotRevision((value) => value + 1)} />
      <AssistancePreparation />
      <ReleaseRegistration refreshKey={snapshotRevision} />
      <ul className={styles.metrics}>
        {view.cards.map((card) => (
          <li key={card.label} data-tone={card.tone}>
            <a href={card.href}><strong>{card.value}</strong><span>{card.label}</span></a>
          </li>
        ))}
      </ul>
      <div className={styles.workflow}>
        <div className={styles.sectionHeading}>
          <h3>Cola de trabajo</h3>
          <span>{view.workflow.attentionCount === 0 ? 'Sin acciones pendientes' : `${view.workflow.attentionCount} requieren atención`}</span>
        </div>
        <ul>
          {view.workflow.items.map((item) => <li data-tone={item.tone} key={`${item.href}:${item.label}`}><a href={item.href}><strong>{item.value}</strong><span>{item.label}</span></a></li>)}
        </ul>
      </div>
      <div className={styles.analytics}>
        <div className={styles.sectionHeading}>
          <h3>Analítica</h3>
          <Link href="/admin/collections/analytics-snapshots">Ver snapshots</Link>
        </div>
        {view.analytics.available ? (
          <>
            <p className={styles.period}>{view.analytics.periodLabel}</p>
            <div className={styles.analyticsGrid}>
              <dl className={styles.traffic}>
                {view.analytics.metrics.map((metric) => (
                  <div key={metric.label}>
                    <dt>{metric.label}</dt>
                    <dd>{metric.value}</dd>
                    {metric.change !== null && <small data-change={metric.change > 0 ? 'up' : metric.change < 0 ? 'down' : 'flat'}>{metric.change > 0 ? '+' : ''}{metric.change}%</small>}
                  </div>
                ))}
              </dl>
              <div className={styles.vitals}>
                <h4>Core Web Vitals</h4>
                <ul>{view.analytics.vitals.map((vital) => <li data-rating={vital.rating} key={vital.label}><span>{vital.label}</span><strong>{vital.value}</strong></li>)}</ul>
              </div>
              <div className={styles.routes}>
                <h4>Rutas principales</h4>
                <ol>{view.analytics.routes.map((route) => <li key={route.label}><span>{route.label}</span><strong>{route.value}</strong></li>)}</ol>
              </div>
            </div>
          </>
        ) : <p className={styles.analyticsEmpty}>Aún no hay un snapshot analítico verificado. No se muestran ceros ficticios.</p>}
      </div>
      <div className={styles.integrations}>
        <div className={styles.sectionHeading}>
          <h3>Conectores y asistencia</h3>
          <Link href="/admin/globals/assistant-settings">Configurar permisos</Link>
        </div>
        <div className={styles.integrationGrid}>
          <ul className={styles.connectors}>
            {view.integrations.connectors.map((connector) => <li data-tone={connector.tone} key={connector.label}><span>{connector.label}</span><strong>{connector.status}</strong></li>)}
          </ul>
          <div className={styles.capabilities}>
            <p>Propuestas permitidas</p>
            <ul>{view.integrations.capabilities.map((capability) => <li data-enabled={capability.enabled} key={capability.label}><span>{capability.label}</span><small>{capability.enabled ? capability.operational ? 'Activa' : 'Sin implementación' : 'Apagada'}</small></li>)}</ul>
          </div>
        </div>
        <p className={styles.safety}>{view.integrations.safety}</p>
      </div>
      {view.activity.length > 0 && (
        <div className={styles.activity}>
          <div className={styles.sectionHeading}>
            <h3>Actividad reciente</h3>
            <Link href="/admin/collections/audit-events">Ver registro</Link>
          </div>
          <ul>
            {view.activity.map((event) => (
              <li data-tone={event.tone} key={event.href}>
                <a href={event.href}><span>{event.action}</span><small>{event.subject}</small></a>
                <strong>{event.outcome}</strong>
                <time dateTime={event.createdAt}>{new Intl.DateTimeFormat('es-ES', { day: '2-digit', hour: '2-digit', minute: '2-digit', month: 'short' }).format(new Date(event.createdAt))}</time>
              </li>
            ))}
          </ul>
        </div>
      )}
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
      {view.versions.length > 0 && (
        <div className={styles.versions}>
          <div className={styles.sectionHeading}>
            <h3>Versiones verificadas</h3>
            <Link href="/admin/collections/releases">Ver historial</Link>
          </div>
          <ul>
            {view.versions.map((version) => (
              <li key={version.href}>
                <a className={styles.versionTitle} href={version.href}>
                  <span>{version.name}</span>
                  <small>{version.summary}</small>
                </a>
                <dl>
                  {version.scores.map((score) => (
                    <div key={score.label}><dt>{score.label}</dt><dd>{score.value}</dd></div>
                  ))}
                </dl>
                <time dateTime={version.createdAt}>{new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(version.createdAt))}</time>
                <RestorePreparation href={version.restoreHref} versionName={version.name} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
