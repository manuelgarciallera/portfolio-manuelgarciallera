import { describe, expect, it, vi } from 'vitest'

import { confirmRestorePlan, executeRestorePlan, prepareRestorePlan } from './client'

describe('restore preparation client', () => {
  it('requires the exact preparation phrase before transport', async () => {
    const request = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
    await expect(prepareRestorePlan('/api/owner/releases/9/restore-plans', 'restaurar', request)).rejects.toThrow(/PREPARAR RESTAURACIÓN/)
    expect(request).not.toHaveBeenCalled()
  })

  it('returns a bounded destination for the prepared plan', async () => {
    const request = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init).toMatchObject({ body: JSON.stringify({ confirmation: 'PREPARAR RESTAURACIÓN' }), credentials: 'same-origin', method: 'POST' })
      return new Response(JSON.stringify({ plan: { id: 50, status: 'ready' } }), { status: 201 })
    })
    await expect(prepareRestorePlan('/api/owner/releases/9/restore-plans', 'PREPARAR RESTAURACIÓN', request)).resolves.toEqual({ href: '/admin/collections/restore-plans/50', status: 'ready' })
  })

  it('rejects malformed success responses and hides server error bodies', async () => {
    const malformed = vi.fn(async () => new Response(JSON.stringify({ plan: { id: '../users', status: 'ready' } }), { status: 201 }))
    await expect(prepareRestorePlan('/api/owner/releases/9/restore-plans', 'PREPARAR RESTAURACIÓN', malformed)).rejects.toThrow('No se pudo preparar la restauración.')
    const failed = vi.fn(async () => new Response('postgres token leaked', { status: 500 }))
    await expect(prepareRestorePlan('/api/owner/releases/9/restore-plans', 'PREPARAR RESTAURACIÓN', failed)).rejects.toThrow('No se pudo preparar la restauración.')
  })
})

describe('restore decision client', () => {
  it('captures a fresh snapshot before confirming and preserves conflict status', async () => {
    const request = vi.fn(async (url: string, init: RequestInit) => {
      if (url === '/api/owner/preview-snapshots') {
        expect(init.body).toBe(JSON.stringify({ pageId: 7, version: 'current-draft' }))
        return new Response(JSON.stringify({ snapshot: { id: 13 } }), { status: 201 })
      }
      expect(url).toBe('/api/owner/restore-plans/50/confirm')
      expect(init.body).toBe(JSON.stringify({ confirmation: 'CONFIRMAR RESTAURACIÓN', currentSnapshot: 13 }))
      return new Response(JSON.stringify({ plan: { id: 50, status: 'conflict' } }))
    })

    await expect(confirmRestorePlan(50, 7, 'CONFIRMAR RESTAURACIÓN', request)).resolves.toEqual({ status: 'conflict' })
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('requires exact confirmation before capturing current state', async () => {
    const request = vi.fn<(url: string, init: RequestInit) => Promise<Response>>()
    await expect(confirmRestorePlan(50, 7, 'confirmar', request)).rejects.toThrow(/CONFIRMAR RESTAURACIÓN/)
    expect(request).not.toHaveBeenCalled()
  })

  it('executes only with the third exact phrase and accepts only executed plans', async () => {
    const request = vi.fn(async (_url: string, init: RequestInit) => {
      expect(init.body).toBe(JSON.stringify({ confirmation: 'EJECUTAR RESTAURACIÓN' }))
      return new Response(JSON.stringify({ plan: { id: 50, status: 'executed' } }))
    })
    await expect(executeRestorePlan(50, 'EJECUTAR RESTAURACIÓN', request)).resolves.toEqual({ status: 'executed' })
    await expect(executeRestorePlan(50, 'ejecutar', request)).rejects.toThrow(/EJECUTAR RESTAURACIÓN/)
    expect(request).toHaveBeenCalledOnce()
  })
})
