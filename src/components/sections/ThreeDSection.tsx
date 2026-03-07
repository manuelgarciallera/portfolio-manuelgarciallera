'use client'

import { useMemo } from 'react'
import { featuredProjects } from '@/data/projects'
import { Button, DeviceMockup, GlassCard, SectionReveal, Tag } from '@/components/ui'
import { useTheme } from '@/hooks/useTheme'

export function ThreeDSection() {
  const { isDark } = useTheme()

  const project3D = useMemo(
    () => featuredProjects.find((project) => project.category === '3d'),
    []
  )

  return (
    <section id="3d" className="section" style={{ background: 'var(--bg)' }}>
      <div className="section-content-wide" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', alignItems: 'center' }}>
        <SectionReveal variant="slide-left">
          <p className="text-caption" style={{ color: 'var(--teal)', marginBottom: '12px' }}>
            3D Experience
          </p>
          <h2 className="text-headline" style={{ color: 'var(--text)', marginBottom: '18px' }}>
            Arquitectura digital
            <br />
            <span className="text-gradient-brand">interactiva en tiempo real.</span>
          </h2>
          <p className="text-body-lg" style={{ color: 'var(--text-sec)', maxWidth: '560px', marginBottom: '24px' }}>
            Pipeline completo de modelado y visualizacion web con Three.js para experiencias inmersivas de producto y espacios.
          </p>

          <GlassCard padding="md" bordered hoverable>
            <h3 style={{ color: 'var(--text)', fontSize: '20px', marginBottom: '8px' }}>{project3D?.title ?? 'Estadio Interactivo 3D'}</h3>
            <p style={{ color: 'var(--text-sec)', fontSize: '14px', marginBottom: '14px' }}>{project3D?.description ?? 'Visualizacion web de estadios con navegacion fluida y enfoque cinematico.'}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {(project3D?.tags ?? ['Three.js', 'GLB', 'WebGL']).slice(0, 4).map((tag) => (
                <Tag key={tag} variant="outline" isDark={isDark}>
                  {tag}
                </Tag>
              ))}
            </div>
            <Button href="#contacto" variant="secondary" isDark={isDark}>
              Hablemos de tu proyecto
            </Button>
          </GlassCard>
        </SectionReveal>

        <SectionReveal variant="slide-right" delay={120}>
          <DeviceMockup isDark={isDark} screenshot={project3D?.screenshot} scrollTilt />
        </SectionReveal>
      </div>
    </section>
  )
}
