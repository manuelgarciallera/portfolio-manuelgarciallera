import { describe, expect, it, vi } from 'vitest'

import { parseAnalyticsImportText, submitAnalyticsImport } from './import-client'

const validSnapshot = {
  capturedAt: '2026-09-05T10:00:00.000Z',
  period: { from: '2026-08-01T00:00:00.000Z', to: '2026-09-01T00:00:00.000Z' },
  routes: [{ pageViews: 12, path: '/', visitors: 8 }],
  source: 'manual-export',
  totals: { pageViews: 12, visitors: 8 },
  vitals: {},
}

describe('analytics import client', () => {
  it('rejects text that is not one JSON object before making a request', () => {
    expect(() => parseAnalyticsImportText('[]')).toThrow(/objeto JSON/i)
    expect(() => parseAnalyticsImportText('{')).toThrow(/JSON válido/i)
  })

  it('submits a bounded confirmation envelope and returns the created snapshot', async () => {
    const request = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init).toMatchObject({
        body: JSON.stringify({ confirmation: 'IMPORTAR ANALÍTICA', data: validSnapshot }),
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      return new Response(JSON.stringify({ snapshot: { id: 17 } }), { status: 201 })
    })

    await expect(submitAnalyticsImport(JSON.stringify(validSnapshot), request)).resolves.toEqual({ id: 17 })
    expect(request).toHaveBeenCalledOnce()
  })

  it('does not expose server error bodies to the editor', async () => {
    const request = vi.fn(async () => new Response(JSON.stringify({ error: 'postgres token leaked' }), { status: 500 }))

    await expect(submitAnalyticsImport(JSON.stringify(validSnapshot), request)).rejects.toThrow('No se pudo importar el snapshot analítico.')
  })

  it('rejects exports larger than the server request limit before transport', async () => {
    const request = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()

    await expect(submitAnalyticsImport(JSON.stringify({ ...validSnapshot, padding: 'x'.repeat(256 * 1024) }), request)).rejects.toThrow(/256 KiB/i)
    expect(request).not.toHaveBeenCalled()
  })
})
