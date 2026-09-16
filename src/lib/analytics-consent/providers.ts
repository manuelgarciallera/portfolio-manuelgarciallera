import { type AnalyticsAdapter } from './controller'
import { CONSENT_KEY, CONSENT_LIFETIME_MS, effectiveConsent, readConsent, type Selection } from './policy'

const HOST = 'manuelgarciallera.com'
const ORIGIN = `https://${HOST}`
const GA = 'G-SD9S08GHWS'
const WEBSITE = '7c0010a4-8f44-4340-8ee2-d8a7bda1152c'
type Payload = Record<string, unknown>
type AnalyticsWindow = Window & {
  'ga-disable-G-SD9S08GHWS'?: boolean
  mglAnalyticsLayer?: unknown[]
  portfolioAnalyticsFilter?: (type: string, payload: Payload) => Payload | false
  umami?: { track(callback: (payload: Payload) => Payload): Promise<unknown> | void }
}

function clearGoogleCookies() {
  // The integration uses a dedicated prefix. Never delete other properties' cookies.
  for (const name of ['mgl_ga', `mgl_ga_${GA.slice(2)}`]) {
    for (const domain of ['', `;domain=${HOST}`, `;domain=.${HOST}`]) {
      document.cookie = `${name}=;max-age=0;path=/;SameSite=Lax;Secure${domain}`
    }
  }
}

export function createProviderAdapters(allowedPaths: readonly string[], onFailure: (provider: keyof Selection) => void) {
  const w = window as AnalyticsWindow
  const allowed = new Set(allowedPaths)
  const privacy = () => navigator.doNotTrack === '1' || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true
  const canonical = () => location.origin === ORIGIN && allowed.has(location.pathname)
  function granted(provider: keyof Selection) {
    try {
      return canonical() && effectiveConsent(readConsent(localStorage.getItem(CONSENT_KEY), Date.now()), privacy())[provider]
    } catch { return false }
  }
  w['ga-disable-G-SD9S08GHWS'] = true
  if (!granted('google')) clearGoogleCookies()

  function scriptAdapter(provider: keyof Selection, id: string, src: string, send: (path: string) => void,
    attributes: Record<string, string> = {}): AnalyticsAdapter {
    let active = false, loaded = false, attempted = false, failed = false
    let pending: string | null = null
    const flush = () => {
      if (!loaded || !active || !pending || !granted(provider)) return
      const current = pending; pending = null
      send(current)
    }
    return {
      start() { active = true },
      stop() {
        active = false; pending = null
        if (provider === 'google') { w['ga-disable-G-SD9S08GHWS'] = true; clearGoogleCookies() }
      },
      page(path) {
        if (!active || failed || !allowed.has(path) || !granted(provider)) return
        pending = path
        if (!attempted) {
          attempted = true
          const script = document.createElement('script')
          if (provider === 'google') {
            gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' })
            gtag('set', { page_location: ORIGIN + path, page_referrer: '', page_title: 'Portfolio',
              allow_google_signals: false, allow_ad_personalization_signals: false })
          }
          script.id = id; script.async = true; script.src = src
          script.referrerPolicy = 'no-referrer'
          Object.entries(attributes).forEach(([key, value]) => script.setAttribute(key, value))
          script.onload = () => { loaded = true; script.dataset.loaded = 'true'; flush() }
          script.onerror = () => { failed = true; pending = null; onFailure(provider) }
          document.head.appendChild(script)
        }
        flush()
      },
    }
  }

  // A separate data layer avoids interacting with unrelated tags.
  w.mglAnalyticsLayer = w.mglAnalyticsLayer || []
  function tag() {
    // gtag's documented queue format is an Arguments object, not an event object.
    // eslint-disable-next-line prefer-rest-params
    w.mglAnalyticsLayer!.push(arguments)
  }
  const gtag = tag as (...args: unknown[]) => void
  let configured = false
  const google = scriptAdapter('google', 'portfolio-ga4-consented',
    `https://www.googletagmanager.com/gtag/js?id=${GA}&l=mglAnalyticsLayer`, path => {
      const page = { page_location: ORIGIN + path, page_referrer: '', page_title: 'Portfolio' }
      w['ga-disable-G-SD9S08GHWS'] = false
      if (!configured) {
        configured = true
        gtag('js', new Date())
        gtag('config', GA, { ...page, send_page_view: false, allow_google_signals: false,
          allow_ad_personalization_signals: false, cookie_prefix: 'mgl', cookie_domain: HOST,
          cookie_path: '/', cookie_expires: CONSENT_LIFETIME_MS / 1000,
          cookie_update: false, cookie_flags: 'SameSite=Lax;Secure' })
      }
      gtag('set', page)
      gtag('event', 'page_view', { ...page, send_to: GA })
    })

  w.portfolioAnalyticsFilter = (type, payload) => {
    if (type !== 'event' || !payload || payload.name || !granted('umami') || typeof payload.url !== 'string') return false
    try {
      const url = new URL(payload.url, ORIGIN)
      if (url.origin !== ORIGIN || !allowed.has(url.pathname)) return false
      return { website: WEBSITE, hostname: HOST, url: url.pathname, referrer: '',
        language: navigator.language, screen: `${screen.width}x${screen.height}` }
    } catch { return false }
  }
  const umami = scriptAdapter('umami', 'portfolio-umami-consented', 'https://cloud.umami.is/script.js', path => {
    const promise = w.umami?.track(() => ({ website: WEBSITE, hostname: HOST, url: path,
      referrer: '', language: navigator.language, screen: `${screen.width}x${screen.height}` }))
    promise?.catch(() => onFailure('umami'))
  }, {
    'data-website-id': WEBSITE, 'data-domains': HOST, 'data-auto-track': 'false',
    'data-exclude-search': 'true', 'data-exclude-hash': 'true', 'data-do-not-track': 'true',
    'data-before-send': 'portfolioAnalyticsFilter',
  })

  return { google, umami }
}
