import { runInNewContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { UMAMI_BOOTSTRAP } from './umami-tracker'

function browser(hostname = 'manuelgarciallera.com', doNotTrack = '0') {
  const scripts: Record<string, unknown>[] = []
  const context = {
    location: { hostname, protocol: 'https:' }, navigator: { doNotTrack }, URL,
    window: {} as Record<string, unknown>,
    document: {
      getElementById: (id: string) => scripts.find(s => s.id === id),
      createElement: () => ({ setAttribute(key: string, value: string) { Object.assign(this, { [key]: value }) } }),
      head: { appendChild: (script: Record<string, unknown>) => scripts.push(script) },
    },
  }
  return { scripts, context, run: () => runInNewContext(UMAMI_BOOTSTRAP, context) }
}

describe('Umami production bootstrap', () => {
  it('loads once with privacy options and the approved website', () => {
    const b = browser(); b.run(); b.run()
    expect(b.scripts).toHaveLength(1)
    expect(b.scripts[0]).toMatchObject({ src: 'https://cloud.umami.is/script.js', 'data-website-id': '7c0010a4-8f44-4340-8ee2-d8a7bda1152c', 'data-exclude-search': 'true', 'data-exclude-hash': 'true', 'data-do-not-track': 'true' })
  })
  it.each(['localhost', '127.0.0.1', 'preview.vercel.app', 'manuelgarciallera.com.evil.test'])('does not load on %s', hostname => {
    const b = browser(hostname); b.run(); expect(b.scripts).toHaveLength(0)
  })
  it('does not load when Do Not Track is enabled', () => {
    const b = browser('manuelgarciallera.com', '1'); b.run(); expect(b.scripts).toHaveLength(0)
  })
  it('filters payloads without leaking queries, fragments or extra fields', () => {
    const b = browser(); b.run()
    const filter = b.context.window.portfolioAnalyticsFilter as (type: string, payload: Record<string, unknown>) => unknown
    expect(filter('event', { website: 'id', hostname: 'manuelgarciallera.com', language: 'es', screen: '390x844', url: '/casos?email=secret#private', referrer: 'https://example.com/path?secret=1', title: 'Case', data: { email: 'private' } })).toEqual({ website: 'id', hostname: 'manuelgarciallera.com', language: 'es', screen: '390x844', url: '/casos', referrer: 'https://example.com/' })
    expect(filter('identify', { email: 'private' })).toBe(false)
  })
})
