'use client'
import { useState, useRef, useEffect } from 'react'
import { featuredProjects } from '@/data/projects'
import type { ProjectCategory } from '@/types'

const TABS: { label: string; value: ProjectCategory | 'all' }[] = [
  { label: 'Todo',       value: 'all' },
  { label: 'UX · LALIGA', value: 'ux' },
  { label: '3D · Estadios', value: '3d' },
  { label: 'Full Stack', value: 'fullstack' },
  { label: 'Branding',   value: 'branding' },
]

export function FeaturedSection() {
  const [activeTab, setActiveTab] = useState<ProjectCategory | 'all'>('all')
  const sectionRef = useRef<HTMLElement>(null)

  const filtered = activeTab === 'all'
    ? featuredProjects
    : featuredProjects.filter((p) => p.category === activeTab)

  // Scroll reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('in')
        else e.target.classList.remove('in')
      }),
      { threshold: 0.1 }
    )
    sectionRef.current?.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="trabajo"
      ref={sectionRef}
      className="section"
      style={{ background: 'var(--bg-mid)' }}
    >
      <div className="section-content">
        {/* Header */}
        <div className="reveal" style={{ marginBottom: '16px' }}>
          <p className="text-caption" style={{ color: 'var(--teal)', marginBottom: '12px' }}>
            Proyectos seleccionados
          </p>
          <h2 className="text-headline" style={{ color: 'var(--text)' }}>
            El trabajo habla
            <br />
            <span
              style={{
                background:           'linear-gradient(135deg, #00C8FF 0%, #FF2D78 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor:  'transparent',
                backgroundClip:      'text',
              }}
            >
              por sí solo.
            </span>
          </h2>
        </div>

        {/* Tabs de filtro */}
        <div
          className="reveal"
          style={{
            display:    'flex',
            gap:        '8px',
            flexWrap:   'wrap',
            marginBottom: '48px',
            marginTop:  '32px',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                padding:      '8px 18px',
                borderRadius: '980px',
                border:       activeTab === tab.value
                  ? '1px solid var(--teal)'
                  : '1px solid var(--divider)',
                background:   activeTab === tab.value
                  ? 'rgba(94,196,200,0.12)'
                  : 'transparent',
                color:        activeTab === tab.value ? 'var(--teal)' : 'var(--text-sec)',
                fontSize:     '13px',
                fontWeight:   activeTab === tab.value ? 600 : 400,
                fontFamily:   "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
                cursor:       'pointer',
                transition:   'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid de proyectos */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap:                 '24px',
          }}
        >
          {filtered.map((project, i) => (
            <article
              key={project.id}
              className="reveal"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <a
                href={`/proyectos/${project.slug}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  style={{
                    borderRadius: '20px',
                    overflow:     'hidden',
                    border:       '1px solid var(--divider)',
                    background:   'var(--glass)',
                    backdropFilter: 'blur(20px)',
                    transition:   'transform 0.3s ease, border-color 0.3s ease',
                    cursor:       'pointer',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = `${project.color}40`
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                    ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--divider)'
                  }}
                >
                  {/* Imagen del proyecto */}
                  <div
                    style={{
                      aspectRatio: '16/9',
                      background:  `linear-gradient(135deg, ${project.color}20, ${project.color}08)`,
                      display:     'flex',
                      alignItems:  'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: '48px', opacity: 0.3 }}>
                      {project.category === 'ux'         ? '✦' :
                       project.category === '3d'         ? '◈' :
                       project.category === 'fullstack'  ? '⬡' : '◎'}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '24px' }}>
                    <p
                      className="text-caption"
                      style={{ color: project.color, marginBottom: '8px' }}
                    >
                      {project.category.toUpperCase()} · {project.year}
                    </p>
                    <h3
                      style={{
                        fontFamily:   "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
                        fontSize:     '19px',
                        fontWeight:   600,
                        color:        'var(--text)',
                        marginBottom: '8px',
                        lineHeight:   1.3,
                      }}
                    >
                      {project.title}
                    </h3>
                    <p
                      style={{
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
                        fontSize:   '14px',
                        color:      'var(--text-sec)',
                        lineHeight: 1.5,
                        marginBottom: '16px',
                      }}
                    >
                      {project.subtitle}
                    </p>
                    {/* Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {project.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding:      '3px 10px',
                            borderRadius: '980px',
                            background:   'var(--divider)',
                            fontSize:     '11px',
                            color:        'var(--text-sec)',
                            fontFamily:   "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
