import type { ConsentController } from './controller'
import { CONSENT_KEY, CONSENT_LIFETIME_MS } from './policy'

export function attachConsentLifecycle(controller: ConsentController, win: EventTarget, doc: EventTarget) {
  let timer: ReturnType<typeof setTimeout> | undefined
  function schedule() {
    clearTimeout(timer)
    const consent = controller.getSnapshot().consent
    if (!consent) return
    const remaining = consent.savedAt + CONSENT_LIFETIME_MS - Date.now()
    // Browser timers cannot represent the whole 180-day interval in one call.
    timer = setTimeout(() => { controller.refresh(); schedule() }, Math.max(1, Math.min(remaining, 2_147_483_647)))
  }
  function storage(event: Event) {
    const key = (event as StorageEvent).key
    if (key === CONSENT_KEY || key === null) controller.refresh()
  }
  const refresh = () => controller.refresh()
  const unsubscribe = controller.subscribe(schedule)
  win.addEventListener('storage', storage)
  win.addEventListener('focus', refresh)
  doc.addEventListener('visibilitychange', refresh)
  controller.refresh()
  schedule()
  return () => {
    clearTimeout(timer)
    unsubscribe()
    win.removeEventListener('storage', storage)
    win.removeEventListener('focus', refresh)
    doc.removeEventListener('visibilitychange', refresh)
  }
}
