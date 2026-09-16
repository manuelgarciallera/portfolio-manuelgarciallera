import { createController, type AnalyticsAdapter } from './controller'
import { CONSENT_KEY, effectiveConsent, readConsent, type Selection } from './policy'

export function createBrowserConsent(allowedPaths: readonly string[]) {
  const allowed = new Set(allowedPaths)
  const privacy = () => navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  const canonical = () => location.origin === 'https://manuelgarciallera.com' && allowed.has(location.pathname)
  const granted = (provider: keyof Selection) => {
    try { return canonical() && effectiveConsent(readConsent(localStorage.getItem(CONSENT_KEY), Date.now()), privacy())[provider] }
    catch { return false }
  }
  function disableGoogle() {
    ;(window as Window & { 'ga-disable-G-SD9S08GHWS'?: boolean })['ga-disable-G-SD9S08GHWS'] = true
    for (const name of ['mgl_ga', 'mgl_ga_SD9S08GHWS']) {
      for (const domain of ['', ';domain=manuelgarciallera.com', ';domain=.manuelgarciallera.com']) {
        document.cookie = `${name}=;max-age=0;path=/;SameSite=Lax;Secure${domain}`
      }
    }
  }
  if (!granted('google')) disableGoogle()
  type Adapters = Record<keyof Selection, AnalyticsAdapter>
  let providers: Adapters | null = null
  let loading: Promise<Adapters> | null = null
  const load = () => loading ??= import('./providers').then(module => {
    providers = module.createProviderAdapters(allowedPaths, provider => controller.reportFailure(provider))
    return providers
  })
  function lazy(provider: keyof Selection): AnalyticsAdapter {
    let active = false
    let pending: string | null = null
    return {
      start() { active = true; providers?.[provider].start() },
      stop() { active = false; pending = null; providers?.[provider].stop(); if (provider === 'google') disableGoogle() },
      page(path) {
        if (!active || !granted(provider)) return
        pending = path
        void load().then(adapters => {
          if (!active || !pending || !granted(provider)) return
          const current = pending; pending = null
          adapters[provider].start(); adapters[provider].page(current)
        }).catch(() => controller.reportFailure(provider))
      },
    }
  }
  const controller = createController({
    storage: { read: () => localStorage.getItem(CONSENT_KEY), write: value => localStorage.setItem(CONSENT_KEY, value) },
    now: Date.now, environment: () => ({ canonical: canonical(), privacy: privacy() }),
    allowedPaths: allowed, adapters: { google: lazy('google'), umami: lazy('umami') },
  })
  return controller
}
