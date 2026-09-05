import { describe, expect, it } from 'vitest'

import { presentOwnerDashboard } from './presentation'

describe('presentOwnerDashboard', () => {
  it('projects bounded operational cards and recent edit destinations', () => {
    expect(presentOwnerDashboard({
      content: { issueCount: 3 },
      media: { issueCount: 2 },
      readiness: { productionReady: false },
      recent: {
        articles: [{ id: 3, title: 'Artículo', slug: 'articulo', status: 'draft', updatedAt: '2026-09-05T10:00:00.000Z' }],
        pages: [],
        projects: [{ id: 1, title: 'Proyecto', slug: 'proyecto', status: 'published', updatedAt: '2026-09-05T11:00:00.000Z' }],
      },
      releases: { count: 7 },
      workflow: { attentionCount: 4 },
    })).toEqual({
      actions: [
        { href: '/admin/collections/projects/create', label: 'Nuevo proyecto' },
        { href: '/admin/collections/pages/create', label: 'Nueva página' },
        { href: '/admin/collections/articles/create', label: 'Nuevo artículo' },
        { href: '/admin/collections/media/create', label: 'Subir medio' },
      ],
      cards: [
        { href: '/admin/collections/projects', label: 'Contenido', tone: 'attention', value: 3 },
        { href: '/admin/collections/media', label: 'Medios', tone: 'attention', value: 2 },
        { href: '/admin/collections/assistance-proposals', label: 'Pendientes', tone: 'attention', value: 4 },
        { href: '/admin/collections/releases', label: 'Versiones', tone: 'neutral', value: 7 },
      ],
      recent: [
        { href: '/admin/collections/projects/1', label: 'Proyecto', meta: 'Proyecto · Publicado', updatedAt: '2026-09-05T11:00:00.000Z' },
        { href: '/admin/collections/articles/3', label: 'Artículo', meta: 'Artículo · Borrador', updatedAt: '2026-09-05T10:00:00.000Z' },
      ],
      runtimeLabel: 'Local protegido',
    })
  })

  it('rejects malformed or excessive dashboard data', () => {
    expect(() => presentOwnerDashboard({ content: { issueCount: -1 } })).toThrow(/dashboard/i)
    expect(() => presentOwnerDashboard({ recent: { articles: new Array(6).fill({}) } })).toThrow(/dashboard/i)
  })
})
