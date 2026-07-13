'use client'

interface CaseItem {
  index: string
  title: string
  titleAccent?: string
  tags: string
  year: string
}

const CASES: CaseItem[] = [
  { index: '01', title: 'Buy&Sell ', titleAccent: 'Marketplace', tags: 'Figma → Angular · CRM · Roles · MySQL', year: '2026' },
  { index: '02', title: 'The UX ', titleAccent: 'Union', tags: 'Producto · Comunidad · Estrategia', year: '2026' },
  { index: '03', title: 'Fintech ', titleAccent: 'App', tags: 'Prototipado móvil · Design system', year: '2025' },
  { index: '04', title: 'Estadio ', titleAccent: '3D', tags: 'Visualización espacial · Experiencia', year: '2025' },
]

export function CasesSection() {
  return (
    <section className="rd-section" id="casos">
      <p className="rd-label rd-reveal" data-index="03">
        Casos seleccionados
      </p>
      <div className="rd-cases">
        {CASES.map((item) => (
          <a key={item.index} className="rd-case rd-reveal" href="#contacto" aria-label={`Caso ${item.title}${item.titleAccent ?? ''}`}>
            <span className="rd-case-index">{item.index}</span>
            <h3 className="rd-case-title">
              {item.title}
              {item.titleAccent ? <em>{item.titleAccent}</em> : null}
            </h3>
            <span className="rd-case-tags">
              {item.tags} · {item.year}
            </span>
            <span className="rd-case-arrow" aria-hidden="true">
              →
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
