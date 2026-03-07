// ============================================================
// DESIGN TOKENS — Manuel García Llera Portfolio
// NUNCA hardcodear colores, espaciados o tipografía fuera de aquí
// ============================================================

export const colors = {
  // Color accent de marca
  teal: '#5ec4c8',

  // Gradiente de marca (cyan → magenta)
  brand: {
    cyan:    '#00C8FF',
    magenta: '#FF2D78',
    cyanDim: 'rgba(0, 200, 255, 0.15)',
  },

  // Modo oscuro (default)
  dark: {
    bg:      '#0a0a0a',
    bgMid:   '#161617',
    bgEnd:   '#1d1d1f',
    text:    '#f5f5f7',
    textSec: '#86868b',
    divider: 'rgba(255,255,255,0.08)',
    glass:   'rgba(255,255,255,0.05)',
    glassBorder: 'rgba(255,255,255,0.1)',
  },

  // Modo claro (invertido — empieza en blanco, acaba en oscuro)
  light: {
    bg:      '#ffffff',
    bgMid:   '#f5f5f7',
    bgEnd:   '#1d1d1f',
    text:    '#1d1d1f',
    textSec: '#6e6e73',
    divider: 'rgba(0,0,0,0.08)',
    glass:   'rgba(255,255,255,0.6)',
    glassBorder: 'rgba(255,255,255,0.8)',
  },
} as const

export const spacing = {
  // Padding de secciones (vertical horizontal)
  sectionPad:       '130px 28px',
  sectionPadMobile: '80px 20px',
  // Máximo ancho de contenido (igual que Apple)
  contentMax:       '980px',
  contentMaxWide:   '1200px',
  // Grid gap
  gridGap:          '24px',
} as const

export const typography = {
  // Sistema de fuentes — SF Pro en Mac, Helvetica Neue en Windows
  fontStack: "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",

  // Escala tipográfica con clamp (fluida entre viewports)
  hero:     'clamp(48px, 8vw, 96px)',
  headline: 'clamp(32px, 5vw, 64px)',
  title:    'clamp(24px, 3vw, 40px)',
  bodyLg:   '19px',
  body:     '17px',
  small:    '14px',
  caption:  '12px',

  // Pesos
  weight: {
    bold:      700,
    semibold:  600,
    medium:    500,
    regular:   400,
  },

  // Interlineado
  leading: {
    hero:     1.05,
    headline: 1.1,
    body:     1.6,
  },
} as const

export const breakpoints = {
  xs:  '375px',
  sm:  '640px',
  md:  '768px',
  lg:  '1024px',
  xl:  '1280px',
  xxl: '1536px',
} as const

export const animation = {
  // Duraciones
  fast:   '150ms',
  normal: '300ms',
  slow:   '600ms',
  slower: '900ms',

  // Easings
  ease:      'cubic-bezier(0.4, 0, 0.2, 1)',
  easeIn:    'cubic-bezier(0.4, 0, 1, 1)',
  easeOut:   'cubic-bezier(0, 0, 0.2, 1)',
  spring:    'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

export const zIndex = {
  base:    0,
  canvas:  0,
  content: 2,
  nav:     50,
  modal:   100,
  toast:   200,
} as const
