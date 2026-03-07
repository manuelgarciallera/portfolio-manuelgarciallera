'use client'

import { skillGroups } from '@/data/skills'
import { Button, GlassCard, SectionReveal, Tag } from '@/components/ui'
import { useTheme } from '@/hooks/useTheme'

export function AboutSection() {
  const { isDark } = useTheme()

  return (
    <section id="sobre-mi" className="section" style={{ background: 'var(--bg-mid)' }}>
      <div className="section-content-wide" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
        <SectionReveal>
          <GlassCard padding="lg" bordered>
            <p className="text-caption" style={{ color: 'var(--teal)', marginBottom: '10px' }}>Sobre mi</p>
            <h2 className="text-title" style={{ color: 'var(--text)', marginBottom: '14px' }}>
              Diseno y desarrollo con criterio de producto.
            </h2>
            <p style={{ color: 'var(--text-sec)', fontSize: '15px', lineHeight: 1.7, marginBottom: '22px' }}>
              Visual Design Manager en LALIGA y desarrollador full stack en formacion avanzada. Mi objetivo es unir estrategia, experiencia de usuario y tecnologia para crear productos memorables.
            </p>
            <Button href="#contacto" variant="blue" isDark={isDark}>Contactar</Button>
          </GlassCard>
        </SectionReveal>

        <SectionReveal delay={100}>
          <GlassCard padding="lg" bordered>
            <p className="text-caption" style={{ color: 'var(--teal)', marginBottom: '10px' }}>Stack</p>
            <div style={{ display: 'grid', gap: '14px' }}>
              {skillGroups.map((group) => (
                <div key={group.category}>
                  <h3 style={{ color: 'var(--text)', fontSize: '14px', marginBottom: '8px' }}>{group.category}</h3>
                  <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                    {group.skills.slice(0, 5).map((skill) => (
                      <Tag key={`${group.category}-${skill}`} variant="default" isDark={isDark}>
                        {skill}
                      </Tag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </SectionReveal>
      </div>
    </section>
  )
}
