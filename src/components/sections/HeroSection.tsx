'use client'
import { useEffect, useRef } from 'react'
import { useTheme } from '@/hooks/useTheme'

export function HeroSection() {
  const { isDark } = useTheme()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Canvas de partículas provisional (se sustituirá por R3F)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles: { x: number; y: number; vx: number; vy: number; r: number; o: number }[] = []
    for (let i = 0; i < 80; i++) {
      particles.push({
        x:  Math.random() * canvas.width,
        y:  Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r:  Math.random() * 1.5 + 0.5,
        o:  Math.random() * 0.4 + 0.1,
      })
    }

    let raf: number
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
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
        position:       'relative',
        height:         '100svh',
        minHeight:      '600px',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        overflow:       'hidden',
        background:     'var(--bg)',
      }}
    >
      {/* Canvas de fondo */}
      <canvas
        ref={canvasRef}
        style={{
          position:      'absolute',
          inset:         0,
          pointerEvents: 'none',
          zIndex:        0,
        }}
        aria-hidden="true"
      />

      {/* Contenido */}
      <div
        style={{
          position:  'relative',
          zIndex:    2,
          textAlign: 'center',
          padding:   '0 28px',
          maxWidth:  '980px',
        }}
      >
        {/* Eyebrow */}
        <p
          className="text-caption"
          style={{
            color:         'var(--teal)',
            marginBottom:  '24px',
            letterSpacing: '0.12em',
          }}
        >
          Visual Design Manager · Full Stack Developer
        </p>

        {/* Headline principal */}
        <h1
          className="text-hero"
          style={{
            color:        'var(--text)',
            marginBottom: '24px',
            fontWeight:   700,
          }}
        >
          Diseño que
          <br />
          <span
            style={{
              background:              'linear-gradient(135deg, #00C8FF 0%, #FF2D78 100%)',
              WebkitBackgroundClip:    'text',
              WebkitTextFillColor:     'transparent',
              backgroundClip:         'text',
            }}
          >
            piensa en código.
          </span>
        </h1>

        {/* Subtítulo */}
        <p
          className="text-body-lg"
          style={{
            color:        'var(--text-sec)',
            maxWidth:     '540px',
            margin:       '0 auto 48px',
          }}
        >
          Visual Design Manager en LALIGA.
          UX, producto, 3D arquitectónico y full stack.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="#trabajo"
            style={{
              display:         'inline-flex',
              alignItems:      'center',
              gap:             '8px',
              padding:         '14px 28px',
              background:      'var(--teal)',
              color:           '#0a0a0a',
              borderRadius:    '980px',
              fontSize:        '15px',
              fontWeight:      600,
              textDecoration:  'none',
              fontFamily:      "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
              transition:      'opacity 0.2s ease',
            }}
          >
            Ver proyectos
          </a>
          <a
            href="#sobre-mi"
            style={{
              display:         'inline-flex',
              alignItems:      'center',
              gap:             '8px',
              padding:         '14px 28px',
              background:      'transparent',
              color:           'var(--text)',
              borderRadius:    '980px',
              border:          '1px solid var(--divider)',
              fontSize:        '15px',
              fontWeight:      500,
              textDecoration:  'none',
              fontFamily:      "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif",
              transition:      'all 0.2s ease',
            }}
          >
            Más sobre mí
          </a>
        </div>
      </div>

      {/* Flecha de scroll */}
      <div
        style={{
          position:  'absolute',
          bottom:    '40px',
          left:      '50%',
          transform: 'translateX(-50%)',
          zIndex:    2,
          animation: 'bounce 2s infinite',
        }}
        aria-hidden="true"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-sec)" strokeWidth="1.5">
          <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(8px); }
        }
      `}</style>
    </section>
  )
}
