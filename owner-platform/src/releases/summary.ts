import { normalizeReleaseQuality, type ReleaseQuality } from './quality'

type Scores = Pick<ReleaseQuality, 'accessibility' | 'performance' | 'usability'>

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('La versión no es válida.')
  return value as Record<string, unknown>
}
const text = (value: unknown, label: string): string => {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${label} no es válido.`)
  return value.trim()
}
const id = (value: unknown, label: string): string | number => {
  if (typeof value === 'string' || typeof value === 'number') return value
  const relation = record(value)
  if (typeof relation.id === 'string' || typeof relation.id === 'number') return relation.id
  throw new TypeError(`${label} no es válido.`)
}
const scores = ({ accessibility, performance, usability }: ReleaseQuality): Scores => ({ accessibility, performance, usability })
const average = (quality: ReleaseQuality[]): Scores => ({
  accessibility: Math.round(quality.reduce((sum, item) => sum + item.accessibility, 0) / quality.length),
  performance: Math.round(quality.reduce((sum, item) => sum + item.performance, 0) / quality.length),
  usability: Math.round(quality.reduce((sum, item) => sum + item.usability, 0) / quality.length),
})

export const buildReleaseSummary = (input: unknown[]) => Object.freeze({
  count: input.length,
  versions: input.map((value) => {
    const release = record(value)
    const gitCommit = text(release.gitCommit, 'El commit')
    if (!/^[a-f0-9]{40}$/.test(gitCommit)) throw new TypeError('El commit no es válido.')
    if (!Array.isArray(release.quality) || release.quality.length === 0) throw new TypeError('La calidad no es válida.')
    const quality = release.quality.map(normalizeReleaseQuality)
    const byViewport = Object.fromEntries(quality.map((item) => [item.viewport, scores(item)])) as Partial<Record<ReleaseQuality['viewport'], Scores>>
    return {
      id: id(release.id, 'El identificador'),
      name: text(release.name, 'El nombre'),
      changeSummary: text(release.changeSummary, 'El resumen'),
      gitCommit,
      createdAt: new Date(text(release.createdAt, 'La fecha')).toISOString(),
      previewSnapshotId: id(release.previewSnapshot, 'El snapshot visual'),
      draftSnapshotId: id(release.draftSnapshot, 'El snapshot restorable'),
      scores: { average: average(quality), ...byViewport },
    }
  }),
})
