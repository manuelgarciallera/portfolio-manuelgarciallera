import { describe, expect, it } from 'vitest'
import { createController, type AnalyticsAdapter } from './controller'
import { CONSENT_LIFETIME_MS } from './policy'

// Only the storage, clock, environment and external SDK boundaries are replaced.
function setup() {
  let raw: string | null = null
  let now = 1_800_000_000_000
  let privacy = false
  let canonical = true
  let storageFails = false
  const events: string[] = []
  const adapter = (name: string): AnalyticsAdapter => ({
    start: () => { events.push(`${name}:start`) },
    stop: () => { events.push(`${name}:stop`) },
    page: path => { events.push(`${name}:${path}`) },
  })
  const controller = createController({
    storage: {
      read: () => { if (storageFails) throw Error('blocked'); return raw },
      write: value => { if (storageFails) throw Error('blocked'); raw = value },
    },
    now: () => now,
    environment: () => ({ canonical, privacy }),
    allowedPaths: new Set(['/', '/casos', '/privacidad']),
    adapters: { google: adapter('google'), umami: adapter('umami') },
  })
  return { controller, events,
    expire: () => { now += CONSENT_LIFETIME_MS },
    protect: () => { privacy = true },
    preview: () => { canonical = false },
    blockStorage: () => { storageFails = true },
    externalReject: () => { raw = JSON.stringify({ version: 1, savedAt: now, google: false, umami: false }) },
  }
}

describe('analytics consent controller', () => {
  it('does not touch SDKs without consent, including visits', () => {
    const { controller, events } = setup()
    controller.refresh(); controller.visit('/'); controller.visit('/casos')
    expect(events).toEqual([])
    expect(controller.getSnapshot().consent).toBeNull()
  })
  it('loads only the chosen provider once and sends only the current page', () => {
    const { controller, events } = setup()
    controller.visit('/'); controller.visit('/casos')
    controller.choose({ google: true, umami: false })
    controller.refresh(); controller.visit('/casos')
    expect(events).toEqual(['google:start', 'google:/casos'])
    controller.visit('/')
    expect(events.at(-1)).toBe('google:/')
  })
  it('rejects all without loading either SDK', () => {
    const { controller, events } = setup()
    controller.choose({ google: false, umami: false })
    expect(events).toEqual([])
    expect(controller.getSnapshot().consent).toMatchObject({ google: false, umami: false })
  })
  it('revokes independently and propagates external rejection', () => {
    const { controller, events, externalReject } = setup()
    controller.visit('/')
    controller.choose({ google: true, umami: true })
    controller.choose({ google: false, umami: true })
    expect(events).toEqual(['google:start', 'google:/', 'umami:start', 'umami:/', 'google:stop'])
    externalReject(); controller.refresh(); controller.visit('/casos')
    expect(events.at(-1)).toBe('umami:stop')
  })
  it.each(['protect', 'preview'] as const)('does not load in %s environment', (action) => {
    const state = setup(); state[action]()
    state.controller.choose({ google: true, umami: true })
    state.controller.visit('/')
    expect(state.events).toEqual([])
  })
  it('expires an active acceptance and stops both providers', () => {
    const { controller, events, expire } = setup()
    controller.choose({ google: true, umami: true }); expire(); controller.refresh()
    expect(controller.getSnapshot().consent).toBeNull()
    expect(events).toEqual(['google:start', 'umami:start', 'google:stop', 'umami:stop'])
  })
  it('fails closed if storing acceptance fails', () => {
    const { controller, events, blockStorage } = setup(); blockStorage()
    expect(controller.choose({ google: true, umami: true })).toBe(false)
    expect(events).toEqual([])
    expect(controller.getSnapshot().error).toBe('storage')
  })
  it('stops active providers even if storing the rejection fails', () => {
    const { controller, events, blockStorage } = setup()
    controller.choose({ google: true, umami: true }); blockStorage()
    controller.choose({ google: false, umami: false }); controller.visit('/casos')
    expect(events).toEqual(['google:start', 'umami:start', 'google:stop', 'umami:stop'])
  })
  it('does not disclose unapproved paths, queries or fragments', () => {
    const { controller, events } = setup()
    controller.choose({ google: true, umami: false })
    controller.visit('/casos?email=secret#private')
    controller.visit('/person/private-token'); controller.visit('https://evil.example/')
    expect(events).toEqual(['google:start', 'google:/casos'])
  })
  it('a new privacy signal stops already enabled providers on refresh', () => {
    const { controller, events, protect } = setup()
    controller.choose({ google: true, umami: false }); protect(); controller.refresh()
    expect(events).toEqual(['google:start', 'google:stop'])
  })
})
