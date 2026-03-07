'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';

interface DeviceMockupProps {
  isDark?: boolean;
  screenContent?: ReactNode;
  screenshot?: string;
  scrollTilt?: boolean;
}

export function DeviceMockup({ isDark = true, screenContent, screenshot, scrollTilt = true }: DeviceMockupProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollTilt) return;
    const wrap = wrapRef.current;
    const device = deviceRef.current;
    if (!wrap || !device) return;

    const onScroll = () => {
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = 1 - (rect.top + rect.height / 2) / vh;
      const clamped = Math.max(-0.5, Math.min(1.5, progress));

      const rotY = (clamped - 0.5) * 28;
      const rotX = (0.5 - Math.abs(clamped - 0.5)) * -10;
      const scale = Math.max(0.85, 0.85 + Math.min(clamped, 1) * 0.18);

      device.style.transform = `perspective(1200px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${scale})`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollTilt]);

  const frameBg = isDark
    ? 'linear-gradient(160deg, #2a2a2e 0%, #1a1a1c 100%)'
    : 'linear-gradient(160deg, #e8e8ed 0%, #d2d2d7 100%)';
  const frameShadow = isDark
    ? '0 0 0 1.5px rgba(255,255,255,0.08), 0 60px 120px rgba(0,0,0,0.7), 0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)'
    : '0 0 0 1.5px rgba(0,0,0,0.08), 0 60px 120px rgba(0,0,0,0.25), 0 20px 40px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)';

  return (
    <div ref={wrapRef} className="flex items-center justify-center" style={{ perspective: '1200px' }}>
      <div
        ref={deviceRef}
        style={{
          width: '252px',
          height: '530px',
          borderRadius: '50px',
          background: frameBg,
          boxShadow: frameShadow,
          padding: '14px',
          transition: 'transform 0.1s ease-out',
          willChange: 'transform',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', right: '-3px', top: '120px', width: '3px', height: '64px', borderRadius: '2px', background: isDark ? '#3a3a3e' : '#c8c8cc' }} />
        {[80, 130, 175].map((top, i) => (
          <div
            key={top}
            style={{
              position: 'absolute',
              left: '-3px',
              top: `${top}px`,
              width: '3px',
              height: i === 0 ? '32px' : '44px',
              borderRadius: '2px',
              background: isDark ? '#3a3a3e' : '#c8c8cc',
            }}
          />
        ))}

        <div style={{ position: 'absolute', top: '22px', left: '50%', transform: 'translateX(-50%)', width: '88px', height: '28px', borderRadius: '20px', background: '#000', zIndex: 10 }} />

        <div style={{ width: '100%', height: '100%', borderRadius: '38px', overflow: 'hidden', background: '#000', position: 'relative' }}>
          {screenshot ? (
            <Image src={screenshot} alt="App screenshot" fill style={{ objectFit: 'cover' }} sizes="252px" unoptimized />
          ) : screenContent ? (
            screenContent
          ) : (
            <DefaultScreen isDark={isDark} />
          )}
        </div>
      </div>
    </div>
  );
}

function DefaultScreen({ isDark }: { isDark: boolean }) {
  const matches = [
    { home: 'Real Madrid', away: 'Barcelona', score: '2-1', live: true },
    { home: 'Atletico', away: 'Sevilla', score: '0-0', live: false },
    { home: 'Mbappe', away: '18 goles', score: '', live: false },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: isDark ? '#000' : '#f5f5f7', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', padding: '60px 16px 20px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ color: isDark ? '#fff' : '#1d1d1f', fontSize: '20px', fontWeight: 700 }}>LALIGA</span>
        <span style={{ fontSize: '11px', color: '#5ec4c8', fontWeight: 600, letterSpacing: '0.5px' }}>EN DIRECTO</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {matches.map((m, i) => (
          <div key={i} style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: '12px', padding: '12px 14px', border: m.live ? '1px solid rgba(94,196,200,0.3)' : '1px solid transparent' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: isDark ? '#f5f5f7' : '#1d1d1f', fontSize: '13px', fontWeight: 500 }}>{m.home}</span>
              {m.score && <span style={{ color: m.live ? '#5ec4c8' : isDark ? '#86868b' : '#6e6e73', fontSize: '13px', fontWeight: 700 }}>{m.score}</span>}
              <span style={{ color: isDark ? '#86868b' : '#6e6e73', fontSize: '13px' }}>{m.away}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-around', background: isDark ? 'rgba(28,28,30,0.9)' : 'rgba(255,255,255,0.9)', borderRadius: '20px', padding: '10px', backdropFilter: 'blur(20px)', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)' }}>
        {['Inicio', 'Tabla', 'Noticias'].map((item) => (
          <span key={item} style={{ fontSize: '11px', color: item === 'Inicio' ? '#5ec4c8' : isDark ? '#86868b' : '#6e6e73', fontWeight: item === 'Inicio' ? 600 : 400 }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
