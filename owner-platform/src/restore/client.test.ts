import { describe, expect, it, vi } from 'vitest'

import { prepareRestorePlan } from './client'

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
