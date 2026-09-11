'use client'

import { useEffect, useId, useRef } from 'react'

// Compatibility for the native textarea's error UI. Keep Payload validation
// and rendering; associate its actual message without replacing user input.
export const FieldErrorBinding = () => {
  const anchor = useRef<HTMLSpanElement>(null)
  const errorId = `owner-field-error-${useId()}`
  useEffect(() => {
    const field = anchor.current?.closest('.field-type')
    if (!field) return
    let clear = () => {}
    const bind = () => {
      clear()
      const restores: Array<() => void> = []
      clear = () => restores.forEach(restore => restore())
      const input = field.querySelector('textarea')
      const error = field.querySelector('.field-error')
      if (!input || !error?.textContent?.trim()) return
      const apply = (element: Element, name: string, value: string) => {
        const before = element.getAttribute(name)
        if (before === value) return
        element.setAttribute(name, value)
        restores.push(() => {
          if (element.getAttribute(name) !== value) return
          if (before === null) element.removeAttribute(name)
          else element.setAttribute(name, before)
        })
      }
      if (!error.id) apply(error, 'id', errorId)
      // Future upstream state wins; this adapter supplies only absent state.
      if (!input.hasAttribute('aria-invalid')) apply(input, 'aria-invalid', 'true')
      const descriptions = (input.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
      if (!descriptions.includes(error.id)) {
        const addedId = error.id
        const before = input.getAttribute('aria-describedby')
        input.setAttribute('aria-describedby', [...descriptions, addedId].join(' '))
        restores.push(() => {
          const current = input.getAttribute('aria-describedby')
          const tokens = (current ?? '').split(/\s+/).filter(Boolean)
          if (!tokens.includes(addedId)) return
          const remaining = tokens.filter(token => token !== addedId)
          if (remaining.length) input.setAttribute('aria-describedby', remaining.join(' '))
          else if (before === '') input.setAttribute('aria-describedby', '')
          else input.removeAttribute('aria-describedby')
        })
      }
    }
    bind()
    const observer = new MutationObserver(bind)
    observer.observe(field, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['class'] })
    return () => { observer.disconnect(); clear() }
  }, [errorId])
  return <span ref={anchor} hidden />
}
