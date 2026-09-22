'use client'

import { useEffect, useRef, useState } from 'react'
import { railVelocity, stepRail } from './railMotion'

export function useRailMotion(trackId: string, automatic: boolean) {
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(false)
  const hold = useRef(() => {})
  const refresh = useRef(() => {})

  useEffect(() => {
    const track = document.getElementById(trackId)
    if (!track || !automatic) return
    const scope = track.closest('section') ?? track
    const desktop = window.matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = false
    let pointer: number | null = null
    let manualUntil = 0
    let frame = 0
    let timer = 0
    let clickTimer = 0
    let suppressClick = false
    let drag: { pointerId: number; x: number; y: number; start: number; moved: boolean } | null = null
    let previous = 0
    let position = track.scrollLeft
    const maximum = () => Math.max(0, track.scrollWidth - track.clientWidth)
    const sync = () => setProgress(maximum() > 0 ? Math.round(track.scrollLeft / maximum() * 1000) : 0)
    const schedule = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick)
    }
    const tick = (now: number) => {
      frame = 0
      const velocity = railVelocity({
        enabled: desktop.matches, reducedMotion: reduced.matches,
        visible: visible && !document.hidden, paused: pausedRef.current,
        focused: track.matches(':focus-within') || Boolean(scope.querySelector(':focus-visible')),
        manual: drag !== null || now < manualUntil,
        pointer, position: track.scrollLeft, maximum: maximum(),
      })
      if (velocity !== 0) {
        // Retain subpixel accumulation even in browsers that round scrollLeft.
        position = stepRail(position, velocity, previous ? (now - previous) / 1000 : 0, maximum())
        track.scrollLeft = position
        sync()
        schedule()
      }
      previous = now
    }
    const pauseForGesture = () => {
      manualUntil = performance.now() + 5000
      window.clearTimeout(timer)
      timer = window.setTimeout(() => { position = track.scrollLeft; previous = 0; schedule() }, 5050)
    }
    const onScroll = () => {
      sync()
      if (drag || performance.now() < manualUntil) position = track.scrollLeft
    }
    const releaseDrag = () => {
      const gesture = drag
      drag = null
      delete track.dataset.dragging
      if (gesture && track.hasPointerCapture(gesture.pointerId)) track.releasePointerCapture(gesture.pointerId)
      return gesture
    }
    const endDrag = (allowClickSuppression = false) => {
      const gesture = releaseDrag()
      if (!gesture) return
      suppressClick = allowClickSuppression && gesture.moved
      // The native click follows pointerup in the same event turn. Never leave
      // suppression armed for a later unrelated click when no click is emitted.
      window.clearTimeout(clickTimer)
      clickTimer = window.setTimeout(() => { suppressClick = false }, 0)
      position = track.scrollLeft
      previous = 0
      pauseForGesture()
    }
    const onDown = (event: PointerEvent) => {
      suppressClick = false
      window.clearTimeout(clickTimer)
      pauseForGesture()
      if (!desktop.matches || event.pointerType !== 'mouse' || !event.isPrimary || event.button !== 0
        || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, start: track.scrollLeft, moved: false }
    }
    const onDragMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.pointerId) return
      if (!(event.buttons & 1)) { endDrag(); return }
      const delta = event.clientX - drag.x
      if (!drag.moved) {
        if (Math.abs(delta) < 6 || Math.abs(delta) <= Math.abs(event.clientY - drag.y)) return
        drag.moved = true
        track.dataset.dragging = 'true'
        // Capture only after a horizontal drag; an ordinary anchor click keeps
        // its original target and native navigation/modifier behavior.
        track.setPointerCapture(event.pointerId)
      }
      event.preventDefault()
      track.scrollLeft = Math.max(0, Math.min(maximum(), drag.start - delta))
      position = track.scrollLeft
      sync()
    }
    const onUp = (event: PointerEvent) => { if (event.pointerId === drag?.pointerId) endDrag(true) }
    const onCancel = (event: PointerEvent) => { if (event.pointerId === drag?.pointerId) endDrag() }
    const onBlur = () => { pointer = null; endDrag() }
    const onClick = (event: MouseEvent) => {
      if (!suppressClick || event.detail === 0) return
      suppressClick = false
      event.preventDefault()
      event.stopImmediatePropagation()
    }
    const onNativeDrag = (event: DragEvent) => { if (drag) event.preventDefault() }
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      const rect = track.getBoundingClientRect()
      pointer = (event.clientX - rect.left) / rect.width
      if (!frame) { position = track.scrollLeft; previous = 0 }
      schedule()
    }
    const onLeave = () => { pointer = null; position = track.scrollLeft; previous = 0; schedule() }
    const onEnvironment = () => { position = track.scrollLeft; previous = 0; sync(); schedule() }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      previous = 0
      if (!visible && frame) { cancelAnimationFrame(frame); frame = 0 }
      schedule()
    }, { threshold: 0.15 })
    const resize = new ResizeObserver(onEnvironment)
    observer.observe(track)
    resize.observe(track)
    track.dataset.motionRail = 'true'
    hold.current = pauseForGesture
    refresh.current = onEnvironment
    sync()
    track.addEventListener('scroll', onScroll, { passive: true })
    track.addEventListener('pointermove', onMove)
    track.addEventListener('pointerleave', onLeave)
    track.addEventListener('pointerdown', onDown)
    track.addEventListener('lostpointercapture', onCancel)
    track.addEventListener('click', onClick, true)
    track.addEventListener('dragstart', onNativeDrag)
    window.addEventListener('pointermove', onDragMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('blur', onBlur)
    track.addEventListener('wheel', pauseForGesture, { passive: true })
    track.addEventListener('keydown', pauseForGesture)
    scope.addEventListener('focusin', onEnvironment)
    scope.addEventListener('focusout', onEnvironment)
    document.addEventListener('visibilitychange', onEnvironment)
    desktop.addEventListener('change', onEnvironment)
    reduced.addEventListener('change', onEnvironment)
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      window.clearTimeout(clickTimer)
      releaseDrag()
      observer.disconnect()
      resize.disconnect()
      delete track.dataset.motionRail
      track.removeEventListener('scroll', onScroll)
      track.removeEventListener('pointermove', onMove)
      track.removeEventListener('pointerleave', onLeave)
      track.removeEventListener('pointerdown', onDown)
      track.removeEventListener('lostpointercapture', onCancel)
      track.removeEventListener('click', onClick, true)
      track.removeEventListener('dragstart', onNativeDrag)
      window.removeEventListener('pointermove', onDragMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('blur', onBlur)
      track.removeEventListener('wheel', pauseForGesture)
      track.removeEventListener('keydown', pauseForGesture)
      scope.removeEventListener('focusin', onEnvironment)
      scope.removeEventListener('focusout', onEnvironment)
      document.removeEventListener('visibilitychange', onEnvironment)
      desktop.removeEventListener('change', onEnvironment)
      reduced.removeEventListener('change', onEnvironment)
      hold.current = () => {}
      refresh.current = () => {}
    }
  }, [trackId, automatic])

  const toggle = () => {
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)
    refresh.current()
  }
  const seek = (value: number) => {
    const track = document.getElementById(trackId)
    if (!track) return
    hold.current()
    track.scrollLeft = Math.max(0, track.scrollWidth - track.clientWidth) * value / 1000
    setProgress(value)
  }
  return { progress, paused, toggle, seek, hold }
}
