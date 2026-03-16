# Manuel García Llera Portfolio

Portfolio profesional construido con **Next.js 16 + React 19 + Three.js** y arquitectura modular por feature.

## Stack
- Next.js (App Router)
- React 19
- Three.js / React Three Fiber
- GSAP / Framer Motion
- Tailwind CSS v4
- TypeScript (tipado del entorno y runtime de Next)

## Estructura
```text
src/
  app/                         # rutas de Next.js
    page.tsx                   # home
    lab/spline/page.tsx        # sandbox Spline
  components/
    ErrorBoundary.tsx
  features/
    portfolio/
      PortfolioRuntime.tsx
      PortfolioPage.jsx
      content.js
      layout.js
      theme.js
      portfolio.css
      hooks/
      components/
      sections/
      three/
      integrations/spline/
  styles/
    globals.css
```

## Scripts
```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```

## Entorno (`.env.local`)
```bash
NEXT_PUBLIC_SPLINE_SCENE_URL=https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode
NEXT_PUBLIC_ENABLE_SPLINE=false
NEXT_PUBLIC_ENABLE_LENIS=false
NEXT_PUBLIC_ENABLE_THEATRE_STUDIO=false
```

## Flujo recomendado
1. `npm install`
2. `npm run dev`
3. Validación antes de commit:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`

Sandbox Spline disponible en: `/lab/spline`
Sandbox Theatre disponible en: `/lab/theatre`

Smooth scroll Lenis (opcional) en la home:
- activar `NEXT_PUBLIC_ENABLE_LENIS=true`

Theatre Studio (opcional, solo para edición visual):
- activar `NEXT_PUBLIC_ENABLE_THEATRE_STUDIO=true`

## Objetivos técnicos del proyecto
- Render 3D pausado fuera de viewport para ahorrar CPU/GPU.
- Accesibilidad base: `skip-link`, foco visible, `prefers-reduced-motion`.
- Nomenclatura consistente por dominio (`features/portfolio/...`).
- Integración preparada para tooling moderno (Spline lab, Three.js, R3F, GSAP).
