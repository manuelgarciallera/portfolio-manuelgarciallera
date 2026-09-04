import type { FigmaSource } from './types'

const FILE_KEY = /^[A-Za-z0-9_-]{6,128}$/
const NODE_ID = /^\d+(?::|-)\d+$/

const invalid = (): never => {
  throw new Error('Invalid Figma source')
}

export const parseFigmaSource = (input: string): FigmaSource => {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    return invalid()
  }

  if (
    url.protocol !== 'https:' ||
    !['figma.com', 'www.figma.com'].includes(url.hostname) ||
    url.port ||
    url.username ||
    url.password
  ) return invalid()

  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length < 2 || !['design', 'file'].includes(parts[0]!) || !FILE_KEY.test(parts[1]!)) return invalid()

  const rawNodeId = url.searchParams.get('node-id')
  if (rawNodeId !== null && !NODE_ID.test(rawNodeId)) return invalid()
  const nodeId = rawNodeId?.replace('-', ':')
  const fileKey = parts[1]!
  const sourceUrl = `https://www.figma.com/${parts[0]}/${fileKey}${nodeId ? `?node-id=${nodeId.replace(':', '-')}` : ''}`

  return { fileKey, ...(nodeId ? { nodeId } : {}), sourceUrl }
}
