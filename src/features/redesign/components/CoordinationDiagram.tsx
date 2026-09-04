interface CoordinationDiagramProps {
  variant?: 'flow' | 'autonomy' | 'consensus' | 'verification'
}

const VARIANT_COPY = {
  flow: ['Solicitud trazada', 'Revisión cruzada', 'Resultado verificable'],
  autonomy: ['L0 · observar', 'L1–L2 · actuar', 'L3 · decisión humana'],
  consensus: ['Propuesta', 'Revisión independiente', 'Consenso'],
  verification: ['95 pruebas', 'Políticas', 'Evidencia'],
} as const

export function CoordinationDiagram({ variant = 'flow' }: CoordinationDiagramProps) {
  return (
    <figure className="rd-coordination-diagram" aria-label="Flujo de coordinación verificable">
      <div className="rd-coordination-agents">
        <span>Claude<small>Diseña · revisa</small></span>
        <span className="is-human">El usuario<small>Dirige · decide L3</small></span>
        <span>Codex<small>Implementa · verifica</small></span>
      </div>
      <ol className="rd-coordination-flow">
        {VARIANT_COPY[variant].map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, '0')}</span>{item}</li>)}
      </ol>
      <div className="rd-coordination-result">
        <span>Evidencia</span><i aria-hidden="true">→</i><strong>Consenso</strong>
      </div>
      <figcaption>Revisión independiente antes del consenso</figcaption>
    </figure>
  )
}
