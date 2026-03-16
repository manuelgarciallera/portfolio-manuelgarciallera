# Manuel Garcia Llera Portfolio

Professional portfolio built with **Next.js 16 + React 19 + Three.js** using a feature-first architecture.

## Stack
- Next.js (App Router)
- React 19
- Three.js / React Three Fiber
- GSAP / Framer Motion
- Theatre.js (core + studio)
- Tailwind CSS v4
- TypeScript

## Project structure
```text
src/
  app/
    page.tsx
    lab/spline/page.tsx
    lab/theatre/page.tsx
    api/web-vitals/route.ts
    robots.ts
    sitemap.ts
    opengraph-image.tsx
  components/
    ErrorBoundary.tsx
    analytics/WebVitalsReporter.tsx
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
      integrations/
        spline/
        theatre/
  lib/
    site-config.ts
  styles/
    globals.css
scripts/
  dev-restart.ps1
  lighthouse-audit.mjs
```

## Scripts
```bash
npm run dev
npm run dev:restart
npm run build
npm run start
npm run lint
npm run typecheck
npm run audit:lighthouse:desktop
npm run audit:lighthouse:mobile
```

`npm run dev:restart` performs a clean local restart:
- kills stale `next dev` processes for this repo
- removes stale `.next/dev/lock`
- starts dev server again on `localhost:3000`

## Environment (`.env.local`)
```bash
NEXT_PUBLIC_SITE_URL=https://manuelgarciallera.com
NEXT_PUBLIC_SPLINE_SCENE_URL=https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode
NEXT_PUBLIC_ENABLE_SPLINE=false
NEXT_PUBLIC_ENABLE_LENIS=false
NEXT_PUBLIC_ENABLE_THEATRE_STUDIO=false
NEXT_PUBLIC_ENABLE_WEB_VITALS=true
NEXT_PUBLIC_WEB_VITALS_ENDPOINT=/api/web-vitals
```

## Recommended workflow
1. `npm install`
2. `npm run dev`
3. Before commit:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`

## Labs
- Spline: `/lab/spline`
- Theatre: `/lab/theatre`

## Technical goals
- Pause heavy 3D animation when sections are offscreen.
- Keep accessibility baseline strong (`skip-link`, focus-visible, reduced motion support).
- Keep naming and structure consistent by feature.
- Keep modern integrations optional via feature flags.
