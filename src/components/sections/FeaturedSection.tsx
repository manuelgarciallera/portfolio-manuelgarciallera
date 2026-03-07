'use client'

import { useMemo, useState } from 'react'
import { featuredProjects } from '@/data/projects'
import type { ProjectCategory } from '@/types'
import { ProjectCard, SectionReveal } from '@/components/ui'

const TABS: { label: string; value: ProjectCategory | 'all' }[] = [
  { label: 'Todo', value: 'all' },
  { label: 'UX · LALIGA', value: 'ux' },
  { label: '3D · Estadios', value: '3d' },
  { label: 'Full Stack', value: 'fullstack' },
  { label: 'Branding', value: 'branding' },
]

export function FeaturedSection() {
  const [activeTab, setActiveTab] = useState<ProjectCategory | 'all'>('all')

  const filtered = useMemo(
    () => (activeTab === 'all' ? featuredProjects : featuredProjects.filter((p) => p.category === activeTab)),
    [activeTab]
  )

  return (
    <section id="trabajo" className="section" style={{ background: 'var(--bg-mid)' }}>
      <div className="section-content-wide">
        <SectionReveal>
          <p className="text-caption" style={{ color: 'var(--teal)', marginBottom: '12px' }}>
            Proyectos seleccionados
          </p>
          <h2 className="text-headline" style={{ color: 'var(--text)' }}>
            El trabajo habla
            <br />
            <span className="text-gradient-brand">por si solo.</span>
          </h2>
        </SectionReveal>

        <SectionReveal delay={80}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '30px', marginBottom: '42px' }}>
            {TABS.map((tab) => {
              const active = activeTab === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  type="button"
                  style={{
                    padding: '8px 18px',
                    borderRadius: '980px',
                    border: active ? '1px solid var(--teal)' : '1px solid var(--divider)',
                    background: active ? 'rgba(94,196,200,0.13)' : 'transparent',
                    color: active ? 'var(--teal)' : 'var(--text-sec)',
                    fontSize: '13px',
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </SectionReveal>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '22px',
          }}
        >
          {filtered.map((project, index) => (
            <SectionReveal key={project.id} delay={index * 75}>
              <a href={`/proyectos/${project.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <ProjectCard project={project} />
              </a>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
