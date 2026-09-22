'use client'

import { useEffect, useRef, useState } from 'react'
import './journey-title-rail.css'

export function JourneyTitleRail({ title }: { title: string }) {
  const railRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const resumeRef = useRef(() => {})
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const rail = railRef.current
    const track = trackRef.current
    if (!rail || !track) return
    const copy = track.firstElementChild as HTMLElement
    const letters = Array.from(track.querySelectorAll<HTMLElement>('[data-title-word]'))
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let visible = true
    let offset = 0
    let previous = 0
    let frame = 0
    let pointer: { x: number; y: number; type: string } | null = null
    let gesture: { id: number; x: number; y: number; offset: number; dragging: boolean } | null = null

    const paint = () => {
      const width = copy.getBoundingClientRect().width
      if (width > 0) offset = ((offset % width) + width) % width
      track.style.transform = `translate3d(${-offset}px,0,0)`
      if (pointer) letters.forEach(word => {
        const rect = word.getBoundingClientRect()
        word.style.setProperty('--title-pointer-x', `${pointer!.x - rect.left}px`)
        word.style.setProperty('--title-pointer-y', `${pointer!.y - rect.top}px`)
      })
    }
    const velocity = () => {
      if (reduced.matches || pausedRef.current || !visible || document.hidden || gesture) return 0
      if (!pointer || pointer.type !== 'mouse') return 18
      const rect = rail.getBoundingClientRect()
      const fraction = Math.max(0, Math.min(1, (pointer.x - rect.left) / rect.width))
      return fraction < .22 ? -180 * (1 - fraction / .22)
        : fraction > .78 ? 180 * ((fraction - .78) / .22) : 0
    }
    const tick = (now: number) => {
      frame = 0
      const speed = velocity()
      if (speed !== 0) {
        offset += speed * Math.min(.05, previous ? (now - previous) / 1000 : 0)
        paint()
        frame = requestAnimationFrame(tick)
      }
      previous = now
    }
    const resume = () => {
      if (!frame && velocity() !== 0) { previous = 0; frame = requestAnimationFrame(tick) }
    }
    const clearPointer = () => { pointer = null; rail.dataset.interacting = 'false'; resume() }
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0) || (event.target as Element).closest('button')) return
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, offset, dragging: false }
      pointer = { x: event.clientX, y: event.clientY, type: event.pointerType }
      rail.dataset.interacting = 'true'
      paint()
    }
    const move = (event: PointerEvent) => {
      pointer = { x: event.clientX, y: event.clientY, type: event.pointerType }
      rail.dataset.interacting = 'true'
      if (gesture && event.pointerId === gesture.id) {
        const dx = event.clientX - gesture.x
        const dy = event.clientY - gesture.y
        if (!gesture.dragging && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
          gesture.dragging = true
          rail.setPointerCapture(event.pointerId)
          rail.dataset.dragging = 'true'
        }
        if (gesture.dragging) { event.preventDefault(); offset = gesture.offset - dx }
      }
      paint()
      resume()
    }
    const end = (event?: PointerEvent) => {
      if (event && gesture && event.pointerId !== gesture.id) return
      const old = gesture
      gesture = null
      delete rail.dataset.dragging
      if (old && rail.hasPointerCapture(old.id)) rail.releasePointerCapture(old.id)
      clearPointer()
    }
    const leave = () => { if (!gesture) clearPointer() }
    const blur = () => end()
    const change = () => { paint(); resume() }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (!visible && frame) { cancelAnimationFrame(frame); frame = 0 }
      resume()
    }, { threshold: .1 })
    const resize = new ResizeObserver(change)
    observer.observe(rail)
    resize.observe(rail)
    resumeRef.current = resume
    rail.addEventListener('pointerdown', down)
    rail.addEventListener('pointermove', move)
    rail.addEventListener('pointerup', end)
    rail.addEventListener('pointercancel', end)
    rail.addEventListener('lostpointercapture', end)
    rail.addEventListener('pointerleave', leave)
    reduced.addEventListener('change', change)
    document.addEventListener('visibilitychange', change)
    window.addEventListener('blur', blur)
    resume()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      resize.disconnect()
      rail.removeEventListener('pointerdown', down)
      rail.removeEventListener('pointermove', move)
      rail.removeEventListener('pointerup', end)
      rail.removeEventListener('pointercancel', end)
      rail.removeEventListener('lostpointercapture', end)
      rail.removeEventListener('pointerleave', leave)
      reduced.removeEventListener('change', change)
      document.removeEventListener('visibilitychange', change)
      window.removeEventListener('blur', blur)
      resumeRef.current = () => {}
    }
  }, [])

  const toggle = () => {
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)
    resumeRef.current()
  }

  return <div ref={railRef} className="rd-journey-title" data-journey-title={title}>
    <div ref={trackRef} className="rd-journey-title__track" data-title-track aria-hidden="true">
      {[0, 1].map(copy => <div className="rd-journey-title__copy" key={copy}>
        {[0, 1, 2, 3].map(index => <span data-title-word key={index}>{title}</span>)}
      </div>)}
    </div>
    <button type="button" className="rd-journey-title__pause" aria-label={paused ? 'Reanudar movimiento del nombre del proyecto' : 'Pausar movimiento del nombre del proyecto'} aria-pressed={paused} onClick={toggle}>
      <svg viewBox="0 0 24 24" aria-hidden="true">{paused ? <path d="m9 6 9 6-9 6Z" /> : <path d="M8 6v12M16 6v12" />}</svg>
    </button>
  </div>
}
