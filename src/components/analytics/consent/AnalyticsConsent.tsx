'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { createBrowserConsent } from '../../../lib/analytics-consent/browser'
import { attachConsentLifecycle } from '../../../lib/analytics-consent/lifecycle'
import type { ConsentController } from '../../../lib/analytics-consent/controller'
import { AnalyticsConsentCard } from './AnalyticsConsentCard'

let runtime: ConsentController | null = null
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
const getSnapshot = () => runtime
const getServerSnapshot = () => null

export function AnalyticsConsent({ allowedPaths }: { allowedPaths: readonly string[] }) {
  const controller = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const pathname = usePathname()
  useEffect(() => {
    // Preserve a single root-layout runtime through StrictMode and SPA navigation.
    if (!runtime) runtime = createBrowserConsent(allowedPaths)
    runtime.visit(location.pathname)
    const detach = attachConsentLifecycle(runtime, window, document)
    listeners.forEach(listener => listener())
    return detach
  }, [allowedPaths])
  useEffect(() => { if (controller && pathname) controller.visit(pathname) }, [controller, pathname])
  return controller ? <AnalyticsConsentCard controller={controller} /> : null
}
