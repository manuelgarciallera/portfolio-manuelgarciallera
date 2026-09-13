// Room for the 5,000-character message and JSON escaping; never trust Content-Length alone.
export const CONTACT_BODY_BYTES = 40_000

type BodyResult = { ok: true; data: unknown } | { ok: false; status: 400 | 413 }

export async function readContactBody(request: Pick<Request, 'body'>): Promise<BodyResult> {
  if (!request.body) return { ok: false, status: 400 }
  const reader = request.body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let bytes = 0
  let text = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > CONTACT_BODY_BYTES) {
        void reader.cancel().catch(() => undefined)
        return { ok: false, status: 413 }
      }
      text += decoder.decode(value, { stream: true })
    }
    text += decoder.decode()
    return { ok: true, data: JSON.parse(text) }
  } catch {
    void reader.cancel().catch(() => undefined)
    return { ok: false, status: 400 }
  } finally {
    reader.releaseLock()
  }
}
