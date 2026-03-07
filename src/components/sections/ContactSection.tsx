'use client'

import { Button, SectionReveal } from '@/components/ui'
import { useTheme } from '@/hooks/useTheme'

export function ContactSection() {
  const { isDark } = useTheme()

  return (
    <section id="contacto" className="section" style={{ background: 'var(--bg)' }}>
      <div className="section-content" style={{ textAlign: 'center' }}>
        <SectionReveal>
          <p className="text-caption" style={{ color: 'var(--teal)', marginBottom: '12px' }}>Contacto</p>
          <h2 className="text-headline" style={{ color: 'var(--text)', marginBottom: '16px' }}>
            Construyamos algo
            <br />
            <span className="text-gradient-brand">potente y diferente.</span>
          </h2>
          <p className="text-body-lg" style={{ color: 'var(--text-sec)', maxWidth: '620px', margin: '0 auto 26px' }}>
            Si buscas una web de alto nivel visual con base tecnica solida, podemos empezar por una propuesta concreta.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Button href="mailto:manuelgarciallera@gmail.com" variant="blue" isDark={isDark}>Email</Button>
            <Button href="https://github.com/manuelgarciallera" variant="social" isDark={isDark} target="_blank" rel="noopener noreferrer">GitHub</Button>
            <Button href="https://linkedin.com/in/manuelgarciallera" variant="social" isDark={isDark} target="_blank" rel="noopener noreferrer">LinkedIn</Button>
          </div>
        </SectionReveal>
      </div>
    </section>
  )
}
