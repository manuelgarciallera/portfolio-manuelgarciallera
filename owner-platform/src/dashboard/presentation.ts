type DashboardCard = { href: string; label: string; tone: 'attention' | 'healthy' | 'neutral'; value: number }
type RecentItem = { href: string; label: string; meta: string; updatedAt: string }
type VersionItem = { createdAt: string; href: string; name: string; scores: { label: string; value: number }[]; summary: string }
type DashboardPresentation = { actions: { href: string; label: string }[]; cards: DashboardCard[]; recent: RecentItem[]; runtimeLabel: string; versions: VersionItem[] }

const object = (value: unknown): Record<string, unknown> | undefined => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined
const count = (value: unknown): number => Number.isInteger(value) && Number(value) >= 0 ? Number(value) : fail()
const fail = (): never => { throw new TypeError('Los datos del dashboard no son válidos.') }
const relationId = (value: unknown): string | number => {
  if ((typeof value === 'string' || typeof value === 'number') && String(value).trim()) return value
  return fail()
}

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
