import { afterEach, describe, expect, it, vi } from 'vitest'
import { createController } from './controller'
import { CONSENT_KEY, CONSENT_LIFETIME_MS, createConsent } from './policy'
import { attachConsentLifecycle } from './lifecycle'

afterEach(() => vi.useRealTimers())
describe('consent browser lifecycle', () => {
  it('stops at expiry without navigation and removes its timer on teardown', () => {
    vi.useFakeTimers(); vi.setSystemTime(1_800_000_000_000)
    let raw: string | null = null
    const events: string[] = []
    const adapter = { start: () => { events.push('start') }, stop: () => { events.push('stop') }, page: () => {} }
    const controller = createController({
      storage: { read: () => raw, write: value => { raw = value } }, now: () => Date.now(),
      environment: () => ({ canonical: true, privacy: false }), allowedPaths: new Set(['/']),
      adapters: { google: adapter, umami: adapter },
    })
    const win = new EventTarget(), doc = new EventTarget()
    const detach = attachConsentLifecycle(controller, win, doc)
    controller.choose({ google: true, umami: false })
    vi.advanceTimersByTime(CONSENT_LIFETIME_MS)
    expect(events).toEqual(['start', 'stop'])
    expect(controller.getSnapshot().consent).toBeNull()
    detach()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('re-reads shared storage and visibility, ignoring unrelated keys', () => {
    let raw: string | null = null
    const events: string[] = []
    const adapter = { start: () => { events.push('start') }, stop: () => { events.push('stop') }, page: () => {} }
    const controller = createController({
      storage: { read: () => raw, write: value => { raw = value } }, now: () => Date.now(),
      environment: () => ({ canonical: true, privacy: false }), allowedPaths: new Set(['/']),
      adapters: { google: adapter, umami: adapter },
    })
    const win = new EventTarget(), doc = new EventTarget()
    const detach = attachConsentLifecycle(controller, win, doc)
    controller.choose({ google: true, umami: false })
    raw = JSON.stringify(createConsent({ google: false, umami: false }, Date.now()))
    win.dispatchEvent(Object.assign(new Event('storage'), { key: 'rd-theme' }))
    expect(events).toEqual(['start'])
    win.dispatchEvent(Object.assign(new Event('storage'), { key: CONSENT_KEY }))
    expect(events).toEqual(['start', 'stop'])
    controller.choose({ google: true, umami: false })
    raw = null
    doc.dispatchEvent(new Event('visibilitychange'))
    expect(events).toEqual(['start', 'stop', 'start', 'stop'])
    detach()
  })
})
