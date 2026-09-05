import { describe, expect, it } from 'vitest'

import { presentOwnerDashboard } from './presentation'

describe('presentOwnerDashboard', () => {
  it('projects bounded operational cards and recent edit destinations', () => {
    expect(presentOwnerDashboard({
      activity: {
        count: 3,
        events: [
          { id: 8, action: 'release.registered', outcome: 'success', subject: { collection: 'releases', id: '7' }, createdAt: '2026-09-05T09:00:00.000Z' },
          { id: 9, action: 'proposal.denied', outcome: 'denied', subject: { collection: 'assistance-proposals', id: '4' }, createdAt: '2026-09-05T08:00:00.000Z' },
          { id: 10, action: 'assistant.context.exported', outcome: 'success', subject: { collection: 'preview-snapshots', id: '12' }, createdAt: '2026-09-05T07:00:00.000Z' },
        ],
      },
      analytics: {
        available: true,
        data: {
          engagement: { averageDurationSeconds: 84, bounceRatePercent: 31.5 },
          period: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' },
          source: 'manual-export',
          topRoutes: [
            { path: '/casos', pageViews: 80, visitors: 40 },
            { path: '/', pageViews: 40, visitors: 20 },
          ],
          traffic: { pageViews: 120, pageViewsChangePercent: 20, visitors: 60, visitorsChangePercent: -5 },
          vitals: {
            cls: { rating: 'good', value: 0.08 },
            inp: { rating: 'good', value: 180 },
            lcp: { rating: 'needs-improvement', value: 2800 },
          },
        },
      },
      content: { issueCount: 3 },
      integrations: {
        assistant: {
          apply: false,
          capabilities: {
            suggestCopy: { enabled: true, operational: true },
            suggestCrop: { enabled: false, operational: false },
            suggestLayout: { enabled: false, operational: false },
            suggestMotion: { enabled: true, operational: true },
            suggestPalette: { enabled: false, operational: true },
          },
          deploy: false,
          providerConfigured: false,
          publish: false,
        },
        connectors: {
          figma: { access: 'read-only', auth: 'personal-access-token', configured: true, plan: 'professional' },
          linocube: { access: 'disabled', configured: false },
        },
      },
      media: { issueCount: 2 },
      readiness: { productionReady: false },
      recent: {
        articles: [{ id: 3, title: 'Artículo', slug: 'articulo', status: 'draft', updatedAt: '2026-09-05T10:00:00.000Z' }],
        pages: [],
        projects: [{ id: 1, title: 'Proyecto', slug: 'proyecto', status: 'published', updatedAt: '2026-09-05T11:00:00.000Z' }],
      },
      releases: {
        count: 7,
        versions: [{
          id: 9,
          name: 'Checkpoint editorial',
          changeSummary: 'Canvas modular y SEO.',
          gitCommit: 'a'.repeat(40),
          createdAt: '2026-09-05T08:00:00.000Z',
          previewSnapshotId: 11,
          draftSnapshotId: 12,
          scores: {
            average: { accessibility: 97, performance: 92, usability: 93 },
            desktop: { accessibility: 98, performance: 96, usability: 94 },
            mobile: { accessibility: 96, performance: 88, usability: 92 },
          },
        }],
      },
      workflow: {
        attentionCount: 12,
        figmaImport: { approvedAwaitingImport: 1, awaitingReview: 1, executions: 1, plans: 3, reviews: { approved: 2, rejected: 0, total: 2 } },
        proposals: { accepted: 4, pending: 3, rejected: 1, total: 8 },
        publication: { approvedAwaitingArtifact: 1, artifacts: 2, awaitingReview: 1, bundles: 5, reviews: { approved: 3, rejected: 1, total: 4 } },
        restores: { confirmed: 1, conflict: 2, executed: 6, ready: 2, total: 11 },
      },
    })).toEqual({
      actions: [
        { href: '/admin/collections/projects/create', label: 'Nuevo proyecto' },
        { href: '/admin/collections/pages/create', label: 'Nueva página' },
        { href: '/admin/collections/articles/create', label: 'Nuevo artículo' },
        { href: '/admin/collections/media/create', label: 'Subir medio' },
        { href: '/admin/collections/brand-profiles/create', label: 'Nuevo perfil de marca' },
        { href: '/admin/collections/media-placements/create', label: 'Nuevo encuadre' },
      ],
      activity: [
        { action: 'Versión registrada', createdAt: '2026-09-05T09:00:00.000Z', href: '/admin/collections/audit-events/8', outcome: 'Correcto', subject: 'releases · 7', tone: 'success' },
        { action: 'Propuesta denegada', createdAt: '2026-09-05T08:00:00.000Z', href: '/admin/collections/audit-events/9', outcome: 'Denegado', subject: 'assistance-proposals · 4', tone: 'attention' },
        { action: 'Contexto de asistencia exportado', createdAt: '2026-09-05T07:00:00.000Z', href: '/admin/collections/audit-events/10', outcome: 'Correcto', subject: 'preview-snapshots · 12', tone: 'success' },
      ],
      analytics: {
        available: true,
        metrics: [
          { change: 20, label: 'Páginas vistas', value: '120' },
          { change: -5, label: 'Visitantes', value: '60' },
          { change: null, label: 'Duración media', value: '1 min 24 s' },
          { change: null, label: 'Rebote', value: '31,5%' },
        ],
        periodLabel: '1 ago – 1 sept 2026',
        routes: [
          { label: '/casos', value: 80 },
          { label: '/', value: 40 },
        ],
        vitals: [
          { label: 'LCP', rating: 'needs-improvement', value: '2,80 s' },
          { label: 'INP', rating: 'good', value: '180 ms' },
          { label: 'CLS', rating: 'good', value: '0,08' },
        ],
      },
      cards: [
        { href: '/admin/collections/projects', label: 'Contenido', tone: 'attention', value: 3 },
        { href: '/admin/collections/media', label: 'Medios', tone: 'attention', value: 2 },
        { href: '/admin/collections/assistance-proposals', label: 'Pendientes', tone: 'attention', value: 12 },
        { href: '/admin/collections/releases', label: 'Versiones', tone: 'neutral', value: 7 },
      ],
      integrations: {
        capabilities: [
          { enabled: true, label: 'Textos', operational: true },
          { enabled: false, label: 'Paleta', operational: true },
          { enabled: false, label: 'Composición', operational: false },
          { enabled: false, label: 'Encuadre', operational: false },
          { enabled: true, label: 'Movimiento', operational: true },
        ],
        connectors: [
          { label: 'Figma', status: 'Listo · solo lectura', tone: 'ready' },
          { label: 'Linocube', status: 'Desactivado', tone: 'disabled' },
          { label: 'Asistente IA', status: 'Sin proveedor', tone: 'disabled' },
        ],
        safety: 'Aplicar, publicar y desplegar: bloqueado',
      },
      recent: [
        { href: '/admin/collections/projects/1', label: 'Proyecto', meta: 'Proyecto · Publicado', updatedAt: '2026-09-05T11:00:00.000Z' },
        { href: '/admin/collections/articles/3', label: 'Artículo', meta: 'Artículo · Borrador', updatedAt: '2026-09-05T10:00:00.000Z' },
      ],
      runtimeLabel: 'Local protegido',
      versions: [{
        createdAt: '2026-09-05T08:00:00.000Z',
        href: '/admin/collections/releases/9',
        name: 'Checkpoint editorial',
        restoreHref: '/api/owner/releases/9/restore-plans',
        scores: [
          { label: 'Rendimiento', value: 92 },
          { label: 'Usabilidad', value: 93 },
          { label: 'Accesibilidad', value: 97 },
        ],
        summary: 'Canvas modular y SEO.',
      }],
      workflow: {
        attentionCount: 12,
        items: [
          { href: '/admin/collections/figma-import-plans', label: 'Importaciones Figma por revisar', tone: 'attention', value: 1 },
          { href: '/admin/collections/figma-import-reviews', label: 'Importaciones Figma aprobadas', tone: 'attention', value: 1 },
          { href: '/admin/collections/assistance-proposals', label: 'Propuestas pendientes', tone: 'attention', value: 3 },
          { href: '/admin/collections/restore-plans', label: 'Restauraciones por revisar', tone: 'attention', value: 5 },
          { href: '/admin/collections/publication-bundles', label: 'Paquetes sin revisión', tone: 'attention', value: 1 },
          { href: '/admin/collections/publication-artifacts', label: 'Aprobaciones sin artefacto', tone: 'attention', value: 1 },
        ],
      },
    })
  })

  it('rejects malformed or excessive dashboard data', () => {
    expect(() => presentOwnerDashboard({ content: { issueCount: -1 } })).toThrow(/dashboard/i)
    expect(() => presentOwnerDashboard({ recent: { articles: new Array(6).fill({}) } })).toThrow(/dashboard/i)
    expect(() => presentOwnerDashboard({ releases: { versions: new Array(21).fill({}) } })).toThrow(/dashboard/i)
    expect(() => presentOwnerDashboard({ releases: { versions: [{ id: 1, name: 'X', changeSummary: 'Y', createdAt: 'bad', scores: { average: {} } }] } })).toThrow(/dashboard/i)
    expect(() => presentOwnerDashboard({ analytics: { available: true, data: { topRoutes: new Array(11).fill({}) } } })).toThrow(/dashboard/i)
    expect(() => presentOwnerDashboard({ integrations: { assistant: { capabilities: { suggestCopy: { enabled: 'yes' } } } } })).toThrow(/dashboard/i)
    expect(() => presentOwnerDashboard({ activity: { events: new Array(21).fill({}) } })).toThrow(/dashboard/i)
    expect(() => presentOwnerDashboard({ workflow: { attentionCount: 1, proposals: { pending: -1 } } })).toThrow(/dashboard/i)
  })

  it('represents a dashboard without analytics as unavailable rather than false zeroes', () => {
    expect(presentOwnerDashboard({ analytics: { available: false, data: null } }).analytics).toEqual({ available: false })
    expect(presentOwnerDashboard({}).workflow).toEqual({ attentionCount: 0, items: [
      { href: '/admin/collections/figma-import-plans', label: 'Importaciones Figma por revisar', tone: 'clear', value: 0 },
      { href: '/admin/collections/figma-import-reviews', label: 'Importaciones Figma aprobadas', tone: 'clear', value: 0 },
      { href: '/admin/collections/assistance-proposals', label: 'Propuestas pendientes', tone: 'clear', value: 0 },
      { href: '/admin/collections/restore-plans', label: 'Restauraciones por revisar', tone: 'clear', value: 0 },
      { href: '/admin/collections/publication-bundles', label: 'Paquetes sin revisión', tone: 'clear', value: 0 },
      { href: '/admin/collections/publication-artifacts', label: 'Aprobaciones sin artefacto', tone: 'clear', value: 0 },
    ] })
  })
})
