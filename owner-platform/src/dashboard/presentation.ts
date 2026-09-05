type DashboardCard = { href: string; label: string; tone: 'attention' | 'healthy' | 'neutral'; value: number }
type ActivityItem = { action: string; createdAt: string; href: string; outcome: string; subject: string; tone: 'attention' | 'success' }
type RecentItem = { href: string; label: string; meta: string; updatedAt: string }
type VersionItem = { createdAt: string; href: string; name: string; restoreHref: string; scores: { label: string; value: number }[]; summary: string }
type AnalyticsPresentation = { available: false } | {
  available: true
  metrics: { change: number | null; label: string; value: string }[]
  periodLabel: string
  routes: { label: string; value: number }[]
  vitals: { label: string; rating: 'good' | 'needs-improvement' | 'poor'; value: string }[]
}
type IntegrationsPresentation = {
  capabilities: { enabled: boolean; label: string; operational: boolean }[]
  connectors: { label: string; status: string; tone: 'disabled' | 'ready' }[]
  safety: string
}
type WorkflowPresentation = { attentionCount: number; items: { href: string; label: string; tone: 'attention' | 'clear'; value: number }[] }
type DashboardPresentation = { actions: { href: string; label: string }[]; activity: ActivityItem[]; analytics: AnalyticsPresentation; cards: DashboardCard[]; integrations: IntegrationsPresentation; recent: RecentItem[]; runtimeLabel: string; versions: VersionItem[]; workflow: WorkflowPresentation }

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
      restoreHref: `/api/owner/releases/${encodeURIComponent(String(relationId(version.id)))}/restore-plans`,
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

const integrationsPresentation = (value: unknown): IntegrationsPresentation => {
  const integrations = value === undefined ? {} : object(value) ?? fail()
  const assistant = integrations.assistant === undefined ? {} : object(integrations.assistant) ?? fail()
  const capabilities = assistant.capabilities === undefined ? {} : object(assistant.capabilities) ?? fail()
  const connectors = integrations.connectors === undefined ? {} : object(integrations.connectors) ?? fail()
  const definitions = [
    ['suggestCopy', 'Textos'],
    ['suggestPalette', 'Paleta'],
    ['suggestLayout', 'Composición'],
    ['suggestCrop', 'Encuadre'],
    ['suggestMotion', 'Movimiento'],
  ] as const
  const projectedCapabilities = definitions.map(([key, label]) => {
    const entry = capabilities[key] === undefined ? { enabled: false, operational: false } : object(capabilities[key]) ?? fail()
    if (typeof entry.enabled !== 'boolean' || typeof entry.operational !== 'boolean') return fail()
    return { enabled: entry.enabled, label, operational: entry.operational }
  })
  const figma = connectors.figma === undefined ? {} : object(connectors.figma) ?? fail()
  const linocube = connectors.linocube === undefined ? {} : object(connectors.linocube) ?? fail()
  const figmaReady = figma.configured === true && figma.access === 'read-only'
  if (figma.configured !== undefined && typeof figma.configured !== 'boolean') return fail()
  if (linocube.configured !== undefined && typeof linocube.configured !== 'boolean') return fail()
  const providerConfigured = assistant.providerConfigured === true
  if (assistant.providerConfigured !== undefined && typeof assistant.providerConfigured !== 'boolean') return fail()
  const safe = ['apply', 'publish', 'deploy'].every((key) => assistant[key] !== true)
  if (!safe) return fail()
  return {
    capabilities: projectedCapabilities,
    connectors: [
      { label: 'Figma', status: figmaReady ? 'Listo · solo lectura' : 'Sin configurar', tone: figmaReady ? 'ready' : 'disabled' },
      { label: 'Linocube', status: 'Desactivado', tone: 'disabled' },
      { label: 'Asistente IA', status: providerConfigured ? 'Proveedor configurado' : 'Sin proveedor', tone: providerConfigured ? 'ready' : 'disabled' },
    ],
    safety: 'Aplicar, publicar y desplegar: bloqueado',
  }
}

const actionLabels: Record<string, string> = {
  'analytics.snapshot.created': 'Snapshot analítico creado',
  'assistant.proposal.accepted': 'Propuesta aceptada',
  'assistant.proposal.created': 'Propuesta creada',
  'assistant.context.exported': 'Contexto de asistencia exportado',
  'draft.snapshot.created': 'Snapshot restorable creado',
  'figma.plan.created': 'Plan de importación Figma creado',
  'preview.snapshot.created': 'Previsualización creada',
  'proposal.denied': 'Propuesta denegada',
  'publication.artifact.created': 'Artefacto de publicación creado',
  'publication.bundle.approved': 'Paquete de publicación aprobado',
  'publication.bundle.created': 'Paquete de publicación creado',
  'release.registered': 'Versión registrada',
  'restore.executed': 'Restauración ejecutada',
  'restore.plan.created': 'Plan de restauración creado',
}

const activityPresentation = (value: unknown): ActivityItem[] => {
  const activity = value === undefined ? {} : object(value) ?? fail()
  const events = activity.events ?? []
  if (!Array.isArray(events) || events.length > 20) return fail()
  return events.slice(0, 5).map((value) => {
    const event = object(value) ?? fail()
    const subject = object(event.subject) ?? fail()
    const action = typeof event.action === 'string' && /^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*){1,5}$/.test(event.action) ? event.action : fail()
    const outcome = event.outcome
    if (outcome !== 'success' && outcome !== 'denied' && outcome !== 'failure') return fail()
    const collection = typeof subject.collection === 'string' && /^[a-z][a-z0-9-]{1,63}$/.test(subject.collection) ? subject.collection : fail()
    const subjectId = relationId(subject.id)
    const id = relationId(event.id)
    const createdAt = date(event.createdAt).toISOString()
    return {
      action: actionLabels[action] ?? action.split('.').join(' · '),
      createdAt,
      href: `/admin/collections/audit-events/${encodeURIComponent(String(id))}`,
      outcome: outcome === 'success' ? 'Correcto' : outcome === 'denied' ? 'Denegado' : 'Fallido',
      subject: `${collection} · ${subjectId}`,
      tone: outcome === 'success' ? 'success' : 'attention',
    }
  })
}

const workflowPresentation = (value: unknown): WorkflowPresentation => {
  const workflow = value === undefined ? {} : object(value) ?? fail()
  const proposals = workflow.proposals === undefined ? {} : object(workflow.proposals) ?? fail()
  const restores = workflow.restores === undefined ? {} : object(workflow.restores) ?? fail()
  const publication = workflow.publication === undefined ? {} : object(workflow.publication) ?? fail()
  const figmaImport = workflow.figmaImport === undefined ? {} : object(workflow.figmaImport) ?? fail()
  const metric = (source: Record<string, unknown>, key: string) => source[key] === undefined ? 0 : count(source[key])
  const pendingProposals = metric(proposals, 'pending')
  const pendingRestores = metric(restores, 'ready') + metric(restores, 'confirmed') + metric(restores, 'conflict')
  const awaitingReview = metric(publication, 'awaitingReview')
  const awaitingArtifact = metric(publication, 'approvedAwaitingArtifact')
  const pendingFigmaImports = metric(figmaImport, 'awaitingReview')
  const derivedAttention = pendingFigmaImports + pendingProposals + pendingRestores + awaitingReview + awaitingArtifact
  const attentionCount = workflow.attentionCount === undefined ? derivedAttention : count(workflow.attentionCount)
  if (attentionCount !== derivedAttention) return fail()
  const item = (href: string, label: string, value: number) => ({ href, label, tone: value > 0 ? 'attention' as const : 'clear' as const, value })
  return {
    attentionCount,
    items: [
      item('/admin/collections/figma-import-plans', 'Importaciones Figma por revisar', pendingFigmaImports),
      item('/admin/collections/assistance-proposals', 'Propuestas pendientes', pendingProposals),
      item('/admin/collections/restore-plans', 'Restauraciones por revisar', pendingRestores),
      item('/admin/collections/publication-bundles', 'Paquetes sin revisión', awaitingReview),
      item('/admin/collections/publication-artifacts', 'Aprobaciones sin artefacto', awaitingArtifact),
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
      { href: '/admin/collections/brand-profiles/create', label: 'Nuevo perfil de marca' },
      { href: '/admin/collections/media-placements/create', label: 'Nuevo encuadre' },
    ],
    activity: activityPresentation(overview.activity),
    analytics: analyticsPresentation(overview.analytics),
    cards: [
      { href: '/admin/collections/projects', label: 'Contenido', tone: contentIssues ? 'attention' : 'healthy', value: contentIssues },
      { href: '/admin/collections/media', label: 'Medios', tone: mediaIssues ? 'attention' : 'healthy', value: mediaIssues },
      { href: '/admin/collections/assistance-proposals', label: 'Pendientes', tone: attention ? 'attention' : 'healthy', value: attention },
      { href: '/admin/collections/releases', label: 'Versiones', tone: 'neutral', value: metric(releases, 'count') },
    ],
    integrations: integrationsPresentation(overview.integrations),
    recent: recentItems(object(overview.recent) ?? {}),
    runtimeLabel: readiness.productionReady === true ? 'Preparado para producción' : 'Local protegido',
    versions: releaseVersions(releases),
    workflow: workflowPresentation(overview.workflow),
  }
}
