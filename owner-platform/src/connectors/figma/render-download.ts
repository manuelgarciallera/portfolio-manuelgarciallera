import 'server-only'

type Fetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

type Options = {
  fetchImpl?: Fetch
  maxBytes?: number
  timeoutMs?: number
}

const hosts = new Set([
  'api-cdn.figma.com',
  'figma-alpha-api.s3.us-west-2.amazonaws.com',
  's3-alpha-sig.figma.com',
  's3-alpha.figma.com',
])

const boundedInteger = (value: number | undefined, fallback: number, minimum: number, maximum: number) =>
  typeof value === 'number' && Number.isInteger(value) && value >= minimum && value <= maximum ? value : fallback

const assertRenderUrl = (value: string): string => {
  let url: URL
  try { url = new URL(value) } catch { throw new TypeError('La URL de render de Figma no es válida.') }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !hosts.has(url.hostname)) {
    throw new TypeError('La URL de render de Figma no está permitida.')
  }
  return url.toString()
}

const readBounded = async (response: Response, maxBytes: number): Promise<Buffer> => {
  const declared = response.headers.get('content-length')
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes)) throw new TypeError('La imagen supera el tamaño permitido.')
  if (!response.body) throw new TypeError('La imagen de Figma está vacía.')
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel()
      throw new TypeError('La imagen supera el tamaño permitido.')
    }
    chunks.push(value)
  }
  if (size === 0) throw new TypeError('La imagen de Figma está vacía.')
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), size)
}

export const downloadFigmaRender = async (renderUrl: string, options: Options = {}) => {
  const url = assertRenderUrl(renderUrl)
  const maxBytes = boundedInteger(options.maxBytes, 20 * 1024 * 1024, 1, 25 * 1024 * 1024)
  const timeoutMs = boundedInteger(options.timeoutMs, 10_000, 1, 30_000)
  let response: Response
  try {
    response = await (options.fetchImpl ?? fetch)(url, {
      credentials: 'omit',
      method: 'GET',
      redirect: 'error',
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (error) {
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) throw new Error('La descarga de Figma agotó el tiempo permitido.')
    throw new Error('No se pudo descargar la imagen de Figma.')
  }
  if (!response.ok) throw new Error('No se pudo descargar la imagen de Figma.')
  if (response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() !== 'image/png') throw new TypeError('Figma no devolvió una imagen PNG válida.')
  const data = await readBounded(response, maxBytes)
  return Object.freeze({ data, mimeType: 'image/png' as const, size: data.byteLength })
}
