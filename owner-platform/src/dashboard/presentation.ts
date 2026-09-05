type DashboardCard = { href: string; label: string; tone: 'attention' | 'healthy' | 'neutral'; value: number }
type RecentItem = { href: string; label: string; meta: string; updatedAt: string }
type VersionItem = { createdAt: string; href: string; name: string; scores: { label: string; value: number }[]; summary: string }
type AnalyticsPresentation = { available: false } | {
  available: true
  metrics: { change: number | null; label: string; value: string }[]
  periodLabel: string
  routes: { label: string; value: number }[]
  vitals: { label: string; rating: 'good' | 'needs-improvement' | 'poor'; value: string }[]
}
type DashboardPresentation = { actions: { href: string; label: string }[]; analytics: AnalyticsPresentation; cards: DashboardCard[]; recent: RecentItem[]; runtimeLabel: string; versions: VersionItem[] }

const object = (value: unknown): Record<string, unknown> | undefined => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
const count = (value: unknown): number => Number.isInteger(value) && Number(value) >= 0 ? Number(value) : fail()
const fail = (): never => { throw new TypeError('Los datos del dashboard no son válidos.') }
const relationId = (value: unknown): string | number => {
  if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) return value
  return fail()
}
const finite = (value: unknown, min = -Infinity, max = Infinity): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max ? value : fail()
const nullableFinite = (value: unknown, min = -Infinity, max = Infinity): number | null => value === null ? null : finite(value, min, max)
const date = (value: unknown): Date => typeof value === 'string' && !Number.isNaN(Date.parse(value)) ? new Date(value) : fail()
const numberLabel = (value: number, maximumFractionDigits = 2) => new Intl.NumberFormat('es-ES', { maximumFractionDigits }).format(value)

const recentItems = (recent: Record<string, unknown>): RecentItem[] => {
  const definitions = [
    ['projects', 'Proyecto'],
    ['pages', 'Página'],
    ['articles', 'Artículo'],
  ] as const
  return definitions.flatMap(([collection, collectionLabel]) => {
    const values = recent[collection] ?? []
    if (!Array.isArray(values) || values.length > 5) return fail()
    return values.map((value) => {
      const item = object(value) ?? fail()
      const id = relationId(item.id)
      const label = typeof item.title === 'string' && item.title.trim() ? item.title.trim() : fail()
      const status = item.status === 'draft' ? 'Borrador' : item.status === 'published' ? 'Publicado' : fail()
      const updatedAt = typeof item.updatedAt === 'string' && !Number.isNaN(Date.parse(item.updatedAt)) ? item.updatedAt : fail()
      return { href: `/admin/collections/${collection}/${encodeURIComponent(String(id))}`, label, meta: `${collectionLabel} · ${status}`, updatedAt }
    })
  }).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 5)
}

const releaseVersions = (releases: Record<string, unknown>): VersionItem[] => {
  const values = releases.versions ?? []
  if (!Array.isArray(values) || values.length > 20) return fail()
  return values.slice(0, 3).map((value) => {
    const version = object(value) ?? fail()
    const average = object(object(version.scores)?.average) ?? fail()
    const createdAt = typeof version.createdAt === 'string' && !Number.isNaN(Date.parse(version.createdAt)) ? version.createdAt : fail()
    const name = typeof version.name === 'string' && version.name.trim() ? version.name.trim() : fail()
    const summary = typeof version.changeSummary === 'string' && version.changeSummary.trim() ? version.changeSummary.trim() : fail()
    return {
      createdAt,
      href: `/admin/collections/releases/${encodeURIComponent(String(relationId(version.id)))}`,
      name,
      scores: [
        { label: 'Rendimiento', value: count(average.performance) },
        { label: 'Usabilidad', value: count(average.usability) },
        { label: 'Accesibilidad', value: count(average.accessibility) },
      ],
      summary,
    }
  })
}

const analyticsPresentation = (value: unknown): AnalyticsPresentation => {
  const analytics = object(value)
  if (!analytics || analytics.available === false) return { available: false }
  if (analytics.available !== true) return fail()
  const data = object(analytics.data) ?? fail()
  const traffic = object(data.traffic) ?? fail()
  const engagement = object(data.engagement) ?? fail()
  const period = object(data.period) ?? fail()
  const topRoutes = data.topRoutes
  if (!Array.isArray(topRoutes) || topRoutes.length > 10) return fail()
  const from = date(period.from)
  const to = date(period.to)
  if (from.getTime() >= to.getTime()) return fail()
  const duration = nullableFinite(engagement.averageDurationSeconds, 0)
  const bounce = nullableFinite(engagement.bounceRatePercent, 0, 100)
  const change = (input: unknown) => nullableFinite(input)
  const vital = (key: 'lcp' | 'inp' | 'cls', label: string, unit: 'seconds' | 'milliseconds' | 'plain') => {
    const entry = object(object(data.vitals)?.[key])
    if (!entry) return []
    if (!['good', 'needs-improvement', 'poor'].includes(String(entry.rating))) return fail()
    const raw = finite(entry.value, 0)
    const formatted = unit === 'seconds'
      ? `${new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(raw / 1000)} s`
      : unit === 'milliseconds' ? `${numberLabel(raw)} ms` : numberLabel(raw)
    return [{ label, rating: entry.rating as 'good' | 'needs-improvement' | 'poor', value: formatted }]
  }
  return {
    available: true,
    metrics: [
      { change: change(traffic.pageViewsChangePercent), label: 'Páginas vistas', value: numberLabel(count(traffic.pageViews), 0) },
      { change: change(traffic.visitorsChangePercent), label: 'Visitantes', value: numberLabel(count(traffic.visitors), 0) },
      { change: null, label: 'Duración media', value: duration === null ? '—' : `${Math.floor(duration / 60)} min ${Math.round(duration % 60)} s` },
      { change: null, label: 'Rebote', value: bounce === null ? '—' : `${numberLabel(bounce)}%` },
    ],
    periodLabel: `${new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(from).replace('.', '')} – ${new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(to).replace('.', '')}`,
    routes: topRoutes.slice(0, 5).map((entry) => {
      const route = object(entry) ?? fail()
      return { label: typeof route.path === 'string' && route.path.startsWith('/') && route.path.length <= 200 ? route.path : fail(), value: count(route.pageViews) }
    }),
    vitals: [
      ...vital('lcp', 'LCP', 'seconds'),
      ...vital('inp', 'INP', 'milliseconds'),
      ...vital('cls', 'CLS', 'plain'),
    ],
  }
}

export const presentOwnerDashboard = (value: unknown): DashboardPresentation => {
  const overview = object(value) ?? fail()
  const content = object(overview.content) ?? {}
  const media = object(overview.media) ?? {}
  const workflow = object(overview.workflow) ?? {}
  const releases = object(overview.releases) ?? {}
  const readiness = object(overview.readiness) ?? {}
  const metric = (source: Record<string, unknown>, key: string) => source[key] === undefined ? 0 : count(source[key])
  const contentIssues = metric(content, 'issueCount')
  const mediaIssues = metric(media, 'issueCount')
  const attention = metric(workflow, 'attentionCount')
  return {
    actions: [
      { href: '/admin/collections/projects/create', label: 'Nuevo proyecto' },
      { href: '/admin/collections/pages/create', label: 'Nueva página' },
      { href: '/admin/collections/articles/create', label: 'Nuevo artículo' },
      { href: '/admin/collections/media/create', label: 'Subir medio' },
    ],
    analytics: analyticsPresentation(overview.analytics),
    cards: [
      { href: '/admin/collections/projects', label: 'Contenido', tone: contentIssues ? 'attention' : 'healthy', value: contentIssues },
      { href: '/admin/collections/media', label: 'Medios', tone: mediaIssues ? 'attention' : 'healthy', value: mediaIssues },
      { href: '/admin/collections/assistance-proposals', label: 'Pendientes', tone: attention ? 'attention' : 'healthy', value: attention },
      { href: '/admin/collections/releases', label: 'Versiones', tone: 'neutral', value: metric(releases, 'count') },
    ],
    recent: recentItems(object(overview.recent) ?? {}),
    runtimeLabel: readiness.productionReady === true ? 'Preparado para producción' : 'Local protegido',
    versions: releaseVersions(releases),
  }
}
