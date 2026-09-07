'use client'

import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react'

const SWIPE_THRESHOLD_PX = 40

export interface SwipeHandlers {
  onPointerDown: (event: ReactPointerEvent) => void
  onPointerMove: (event: ReactPointerEvent) => void
  onPointerUp: () => void
  onPointerCancel: () => void
}

export interface SwipeApi {
  swipeHandlers: SwipeHandlers
  consumeDrag: () => boolean
}

/**
 * Gesto horizontal para superficies táctiles. Ignora el ratón para no interferir
 * con la selección de texto ni con los estados hover del escritorio.
 * `consumeDrag` permite cancelar el click de un enlace superpuesto cuando el
 * usuario ha arrastrado en lugar de tocar.
 */
export function useSwipe(onSwipe: (direction: -1 | 1) => void): SwipeApi {
  const origin = useRef<{ x: number; y: number; id: number } | null>(null)
  const dragged = useRef(false)

  const onPointerDown = useCallback((event: ReactPointerEvent) => {
    if (event.pointerType === 'mouse') return
    origin.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
    dragged.current = false
  }, [])

  const onPointerMove = useCallback((event: ReactPointerEvent) => {
    const start = origin.current
    if (!start || start.id !== event.pointerId) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) return
    origin.current = null
    dragged.current = true
    onSwipe(dx < 0 ? 1 : -1)
  }, [onSwipe])

  const release = useCallback(() => {
    origin.current = null
  }, [])

  const consumeDrag = useCallback(() => {
    const was = dragged.current
    dragged.current = false
    return was
  }, [])

  return {
    swipeHandlers: { onPointerDown, onPointerMove, onPointerUp: release, onPointerCancel: release },
    consumeDrag,
  }
}
