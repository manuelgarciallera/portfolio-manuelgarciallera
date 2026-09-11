'use client'

import { JSONField } from '@payloadcms/ui'
import { useEffect, useState, type ComponentProps } from 'react'
import { initializeLocalMonaco } from './local-monaco'

// Payload bundles a private loader. Let local Monaco initialize first so that
// its native JSONField finds window.monaco instead of requesting a CDN copy.
export function LocalJSONField(props: ComponentProps<typeof JSONField>) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  useEffect(() => {
    let mounted = true
    void initializeLocalMonaco().then(() => {
      if (mounted) setState('ready')
    }, () => {
      if (mounted) setState('error')
    })
    // Initialization is shared by all fields; do not cancel it on unmount.
    return () => { mounted = false }
  }, [])
  if (state === 'error') return <div role="alert">
    <p>No se ha podido cargar el editor de datos.</p>
    <button type="button" onClick={() => window.location.reload()}>Recargar para reintentar</button>
  </div>
  if (state === 'loading') return <p role="status">Cargando editor de datos…</p>
  return <JSONField {...props} />
}
