'use client'

import { useEffect, useRef } from 'react'

// Payload 3.88 does not pass its FieldLabel target to RelationshipInput's
// react-select input. Keep the native field (including permissions and search),
// and bind its existing label after the input's deferred mount. Remove this
// compatibility adapter when the upstream field passes our browser regression.
export const RelationshipLabelBinding = () => {
  const anchor = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const field = anchor.current?.closest('.relationship')
    if (!field) return
    const bind = () => {
      const label = field.querySelector<HTMLLabelElement>(':scope > label.field-label')
      const input = field.querySelector<HTMLInputElement>('input[role="combobox"]')
      if (label && input?.id && label.htmlFor !== input.id) label.htmlFor = input.id
    }
    bind()
    const observer = new MutationObserver(bind)
    observer.observe(field, { childList: true, subtree: true, attributes: true, attributeFilter: ['id', 'for'] })
    return () => observer.disconnect()
  }, [])
  return <span ref={anchor} hidden />
}
