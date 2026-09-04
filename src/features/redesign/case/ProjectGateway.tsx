'use client'

import { useViewportActivity } from '../hooks/useViewportActivity'

export function ProjectGateway() {
  const [sectionRef, isActive] = useViewportActivity<HTMLElement>()
  return (
    <section ref={sectionRef} data-motion={isActive ? 'active' : 'paused'} className="rd-project-gateway" aria-labelledby="project-gateway-title">
      <div className="rd-project-gateway__orbit" aria-hidden="true">
        <span /><span /><span />
        <b>UX</b><b>UI</b><b>DEV</b>
      </div>
      <div className="rd-project-gateway__copy">
        <p>El preámbulo termina. El producto empieza.</p>
        <h2 id="project-gateway-title">Del sistema a la experiencia.</h2>
        <span>Decisiones, componentes y código real del marketplace.</span>
        <div className="rd-project-gateway__actions">
          <a className="rd-project-gateway__primary" href="#fase-desarrollo">Entrar en el proyecto <i aria-hidden="true">↘</i></a>
          <a href="https://www.figma.com/design/ilgPpOdrbhQoPV25IgWXfK/Buy-Sell?node-id=0-1" target="_blank" rel="noreferrer">Abrir prototipo en Figma ↗</a>
        </div>
      </div>
    </section>
  )
}
