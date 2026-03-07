'use client'

import { useEffect, useRef } from 'react'
import { DeviceMockup, Button, GradientText, SectionReveal } from '@/components/ui'
import { useTheme } from '@/hooks/useTheme'

export function HeroSection() {
  const { isDark } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)

    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = []
    for (let i = 0; i < 90; i += 1) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.5,
        o: Math.random() * 0.35 + 0.1,
      })
    }

    let raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(94,196,200,${p.o})`
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section
      id="hero"
      style={{
        position: 'relative',
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 80% 20%, rgba(94,196,200,0.12), transparent 40%), var(--bg)',
        paddingTop: '90px',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
        aria-hidden="true"
      />

      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 28px 56px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <SectionReveal>
          <p className="text-caption" style={{ color: 'var(--teal)', marginBottom: '18px' }}>
            Visual Design Manager · Full Stack Developer
          </p>

          <h1 className="text-hero" style={{ color: 'var(--text)', marginBottom: '20px' }}>
            Diseno que
            <br />
            <GradientText variant="brand">piensa en codigo.</GradientText>
          </h1>

          <p className="text-body-lg" style={{ color: 'var(--text-sec)', maxWidth: '560px', marginBottom: '30px' }}>
            UX, producto digital, arquitectura 3D y desarrollo full stack. Una web cuidada visualmente y tecnicamente.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button href="#trabajo" variant="blue" isDark={isDark}>
              Ver proyectos
            </Button>
            <Button href="#sobre-mi" variant="secondary" isDark={isDark}>
              Mas sobre mi
            </Button>
          </div>
        </SectionReveal>

        <SectionReveal variant="scale" delay={120}>
          <DeviceMockup isDark={isDark} scrollTilt />
        </SectionReveal>
      </div>
    </section>
  )
}
