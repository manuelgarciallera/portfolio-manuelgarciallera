'use client'

import { scrollRail } from './scrollRail'

export function RailControls({ trackId }: { trackId: string }) {
  const move = (direction: -1 | 1) => {
    const track = document.getElementById(trackId)
    if (track) scrollRail(track, direction)
  }
  return <div className="rd-art-gallery__controls" role="group" aria-label="Navegar por los proyectos">
    <button type="button" aria-label="Ver proyectos anteriores" aria-controls={trackId} onClick={() => move(-1)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg>
    </button>
    <button type="button" aria-label="Ver proyectos siguientes" aria-controls={trackId} onClick={() => move(1)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg>
    </button>
  </div>
}
