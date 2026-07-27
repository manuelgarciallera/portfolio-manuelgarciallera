import { CASES } from '../content/cases'
import { CaseCard } from './CaseCard'

export function CasesSection() {
  return (
    <section className="rd-section" id="casos">
      <p className="rd-label rd-reveal" data-index="03">
        Casos seleccionados
      </p>
      <div className="rd-cases">
        {CASES.map((item) => (
          <CaseCard key={item.slug} item={item} />
        ))}
      </div>
    </section>
  )
}
