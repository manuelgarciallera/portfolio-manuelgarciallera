import { createBubbleEmitter, type LetterBox } from './orb-bubbles-engine'

// Optional desktop layer, loaded separately from the orb and never hit-tested.
export function attachOrbBubbles(orbCanvas: HTMLCanvasElement) {
  const hero = orbCanvas.closest<HTMLElement>('.rd-hero')
  const heading = hero?.querySelector<HTMLElement>('h1')
  if (!hero || !heading) return () => {}
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}
  canvas.className = 'rd-orb-bubbles'; canvas.setAttribute('aria-hidden', 'true')
  Object.assign(canvas.style, { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '8' })
  document.body.append(canvas)
  const emitter = createBubbleEmitter()
  let frame = 0, dirty = true, disposed = false
  let letters: LetterBox[] = [], orbRect: DOMRect, heroRect: DOMRect
  const allowed = () => !disposed && !document.hidden && heroRect?.bottom > 0 && heroRect?.top < innerHeight
  const stop = () => { cancelAnimationFrame(frame); frame = 0; emitter.clear(); ctx.clearRect(0, 0, innerWidth, innerHeight) }
  const invalidate = () => { stop(); dirty = true }
  const measure = () => {
    const ratio = Math.min(devicePixelRatio, 1.25, 1920 / Math.max(innerWidth, innerHeight))
    canvas.width = Math.round(innerWidth * ratio); canvas.height = Math.round(innerHeight * ratio)
    canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`; ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    heroRect = hero.getBoundingClientRect(); orbRect = orbCanvas.getBoundingClientRect(); letters = []
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent || ''
      for (let i = 0; i < text.length; i++) {
        if (!text[i].trim()) continue
        const range = document.createRange(); range.setStart(node, i); range.setEnd(node, i + 1)
        const r = range.getBoundingClientRect(); letters.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom })
      }
    }
    dirty = false
  }
  const paint = (now: number) => {
    frame = 0
    if (!allowed()) { stop(); return }
    emitter.tick(now, letters); ctx.clearRect(0, 0, innerWidth, innerHeight)
    ctx.save(); ctx.beginPath(); ctx.rect(0, Math.max(0, heroRect.top), innerWidth, Math.min(innerHeight, heroRect.bottom) - Math.max(0, heroRect.top)); ctx.clip()
    for (const p of emitter.particles) {
      const r = p.radius * (p.hit === null ? 1 : 1 + (now - p.hit) / 700)
      ctx.globalAlpha = p.alpha
      const glow = ctx.createRadialGradient(p.x, p.y, r * .65, p.x, p.y, r * 2.4)
      glow.addColorStop(0, `hsla(${p.hue},100%,58%,.26)`); glow.addColorStop(1, `hsla(${p.hue},100%,58%,0)`)
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.4, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = `hsl(${p.hue},100%,65%)`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = `hsla(${p.hue},100%,55%,.1)`; ctx.fill()
      ctx.strokeStyle = '#ffe8b6'; ctx.lineWidth = .9; ctx.beginPath(); ctx.arc(p.x - r * .12, p.y - r * .12, r * .66, Math.PI * 1.1, Math.PI * 1.48); ctx.stroke()
    }
    ctx.restore()
    if (emitter.particles.length) frame = requestAnimationFrame(paint)
  }
  const move = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || disposed || document.hidden) return
    if (dirty) measure()
    if (!allowed()) return
    const x = orbRect.left + orbRect.width / 2, y = orbRect.top + orbRect.height / 2
    const inside = Math.hypot(event.clientX - x, event.clientY - y) < Math.min(orbRect.width, orbRect.height) * .35
    emitter.move(event.clientX, event.clientY, event.timeStamp, inside)
    if (!frame && emitter.particles.length) frame = requestAnimationFrame(paint)
  }
  const resize = new ResizeObserver(invalidate); resize.observe(hero); resize.observe(orbCanvas)
  window.addEventListener('pointermove', move, { passive: true })
  window.addEventListener('scroll', invalidate, { passive: true })
  window.addEventListener('resize', invalidate, { passive: true })
  window.addEventListener('blur', stop)
  document.addEventListener('visibilitychange', invalidate)
  return () => {
    disposed = true; stop(); resize.disconnect(); canvas.remove()
    window.removeEventListener('pointermove', move); window.removeEventListener('scroll', invalidate)
    window.removeEventListener('resize', invalidate); window.removeEventListener('blur', stop)
    document.removeEventListener('visibilitychange', invalidate)
  }
}
