import { createConsent, effectiveConsent, readConsent, type Consent, type Selection } from './policy'
export type AnalyticsAdapter = { start(): void; stop(): void; page(path: string): void }
export type ControllerOptions = {
  storage: { read(): string | null; write(value: string): void }
  now(): number
  environment(): { canonical: boolean; privacy: boolean }
  allowedPaths: ReadonlySet<string>
  adapters: Record<keyof Selection, AnalyticsAdapter>
}
export type ConsentSnapshot = { consent: Consent | null; privacy: boolean; error: 'storage' | 'provider' | null }
export function createController(options: ControllerOptions) {
  let snapshot: ConsentSnapshot = { consent: null, privacy: false, error: null }
  let path: string | null = null
  let storageFailed = false
  const listeners = new Set<() => void>()
  const active: Selection = { google: false, umami: false }
  const broken: Selection = { google: false, umami: false }
  const lastPath: Record<keyof Selection, string | null> = { google: null, umami: null }
  const providers = ['google', 'umami'] as const

  function sync(consent: Consent | null, error: ConsentSnapshot['error'] = null) {
    const { canonical, privacy } = options.environment()
    const selection = effectiveConsent(consent, privacy || !canonical || storageFailed)
    for (const provider of providers) {
      const adapter = options.adapters[provider]
      try {
        if (active[provider] && !selection[provider]) {
          active[provider] = false
          lastPath[provider] = null
          adapter.stop()
        }
        if (selection[provider] && !broken[provider]) {
          if (!active[provider]) {
            adapter.start()
            active[provider] = true
          }
          if (path && lastPath[provider] !== path) {
            adapter.page(path)
            lastPath[provider] = path
          }
        }
      } catch {
        broken[provider] = true
        active[provider] = false
        error = 'provider'
        try { adapter.stop() } catch { /* Keep the UI usable on SDK failure. */ }
      }
    }
    const next = { consent, privacy, error }
    if (JSON.stringify(next) !== JSON.stringify(snapshot)) {
      snapshot = next
      listeners.forEach(listener => listener())
    }
  }

  function refresh() {
    if (storageFailed) { sync(null, 'storage'); return }
    try { sync(readConsent(options.storage.read(), options.now())) }
    catch { storageFailed = true; sync(null, 'storage') }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    refresh,
    choose(selection: Selection) {
      const consent = createConsent(selection, options.now())
      try {
        options.storage.write(JSON.stringify(consent))
        if (options.storage.read() !== JSON.stringify(consent)) throw Error('storage')
        storageFailed = false
        sync(consent)
        return true
      } catch {
        // A failed save must never leave an old acceptance active in this tab.
        storageFailed = true
        sync(null, 'storage')
        return false
      }
    },
    visit(value: string) {
      const clean = value.split(/[?#]/, 1)[0]
      path = options.allowedPaths.has(clean) ? clean : null
      if (!path) providers.forEach(provider => { lastPath[provider] = null })
      refresh()
    },
    dispose() {
      providers.forEach(provider => {
        if (active[provider]) {
          active[provider] = false
          try { options.adapters[provider].stop() } catch { /* Best effort on teardown. */ }
        }
      })
      listeners.clear()
    },
  }
}
export type ConsentController = ReturnType<typeof createController>
