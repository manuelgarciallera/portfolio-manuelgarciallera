'use client'

import { useEffect, useRef } from 'react'

const labels: Record<string, string> = {
  bold: 'Negrita', italic: 'Cursiva', underline: 'Subrayado',
  strikethrough: 'Tachado', subscript: 'Subíndice', superscript: 'Superíndice',
  inlineCode: 'Código en línea', link: 'Editar enlace',
  indentDecrease: 'Reducir sangría', indentIncrease: 'Aumentar sangría',
}
const toggles = new Set(['bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', 'inlineCode'])

// Compatibility for Payload 3.88's native toolbar buttons. No editor state,
// commands or event handlers are replaced. Remove when upstream passes the
// accessible-name/browser regression. Observe only the private admin shell.
export const OwnerRichTextAccessibility = () => {
  const anchor = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const shell = anchor.current?.closest('.template-default')
    if (!shell) return
    const owned = new Map<Element, Map<string, { before: string | null; applied: string }>>()
    const set = (button: Element, name: string, value: string) => {
      let attributes = owned.get(button)
      const prior = attributes?.get(name)
      const current = button.getAttribute(name)
      // Do not overwrite labels/states supplied by an upstream update.
      if (!prior && current !== null) return
      if (prior && current !== prior.applied) return
      if (current === value) return
      if (!attributes) { attributes = new Map(); owned.set(button, attributes) }
      attributes.set(name, { before: prior ? prior.before : current, applied: value })
      button.setAttribute(name, value)
    }
    const bind = () => {
      for (const element of owned.keys()) if (!element.isConnected) owned.delete(element)
      for (const button of shell.querySelectorAll<HTMLButtonElement>('.toolbar-popup__button[data-button-key]')) {
        const key = button.dataset.buttonKey ?? ''
        if (!Object.hasOwn(labels, key)) continue
        set(button, 'aria-label', labels[key])
        set(button, 'title', labels[key])
        if (toggles.has(key)) set(button, 'aria-pressed', String(button.classList.contains('active')))
        set(button, 'aria-disabled', String(button.classList.contains('disabled') || button.disabled))
      }
    }
    bind()
    const observer = new MutationObserver(bind)
    observer.observe(shell, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled'] })
    return () => {
      observer.disconnect()
      for (const [element, attributes] of owned) for (const [name, state] of attributes) {
        if (element.getAttribute(name) !== state.applied) continue
        if (state.before === null) element.removeAttribute(name)
        else element.setAttribute(name, state.before)
      }
    }
  }, [])
  return <span ref={anchor} hidden />
}
