'use client'

import { scrollRail } from './scrollRail'
import { useRailMotion } from './useRailMotion'

export function RailControls({ trackId, content = 'proyectos', automatic = false }: { trackId: string; content?: 'proyectos' | 'artículos'; automatic?: boolean }) {
  const motion = useRailMotion(trackId, automatic)
  const move = (direction: -1 | 1) => {
    motion.hold.current()
    const track = document.getElementById(trackId)
    if (track) scrollRail(track, direction)
  }
  return <div className={`rd-art-gallery__controls${automatic ? ' rd-art-gallery__controls--motion' : ''}`} role="group" aria-label={`Navegar por los ${content}`}>
    {automatic && <>
      <button className="rd-art-gallery__pause" type="button" aria-label={motion.paused ? 'Reanudar movimiento de la galería' : 'Pausar movimiento de la galería'} aria-pressed={motion.paused} onClick={motion.toggle}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{motion.paused ? <path d="m9 5 10 7-10 7Z" /> : <path d="M8 5v14M16 5v14" />}</svg>
      </button>
      <input className="rd-art-gallery__position" type="range" min={0} max={1000} step={1} value={motion.progress}
        aria-label="Posición de la galería de proyectos" aria-controls={trackId} aria-valuetext={`${Math.round(motion.progress / 10)} %`}
        onPointerDown={() => motion.hold.current()} onChange={event => motion.seek(Number(event.currentTarget.value))} />
    </>}
    <button type="button" aria-label={`Ver ${content} anteriores`} aria-controls={trackId} onClick={() => move(-1)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
    </button>
    <button type="button" aria-label={`Ver ${content} siguientes`} aria-controls={trackId} onClick={() => move(1)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
    </button>
  </div>
}
