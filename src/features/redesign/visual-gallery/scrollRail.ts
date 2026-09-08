export function scrollRail(track: HTMLElement, direction: -1 | 1) {
  const item = track.firstElementChild
  if (!item) return
  const gap = Number.parseFloat(getComputedStyle(track).columnGap) || 0
  const step = item.getBoundingClientRect().width + gap
  track.scrollBy({
    left: direction * step,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  })
}
