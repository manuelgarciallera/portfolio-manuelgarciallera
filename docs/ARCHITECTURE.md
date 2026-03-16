# Arquitectura del Portfolio

## Principio base
El proyecto se organiza por **feature**, no por tipo técnico.  
Todo lo relacionado con la home está bajo `src/features/portfolio`.

## Capas del módulo `portfolio`

- `PortfolioRuntime.tsx`
  - Punto de entrada de la feature.
  - Envuelve la página con `ErrorBoundary`.
- `PortfolioPage.jsx`
  - Orquestador de secciones.
  - Estado global de la feature (tema, navegación activa, layout responsive).
- `sections/`
  - Secciones visuales autocontenidas.
  - Cada sección tiene su propia lógica de animación/canvas.
- `three/`
  - Recursos 3D reutilizables (shaders y canvases dedicados).
- `hooks/`
  - Hooks específicos de la feature (`viewport`, `reveal`).
- `integrations/`
  - Integraciones externas desacopladas (`spline/`).

## Convenciones de nomenclatura

- Componentes de sección: `PascalCaseSection.jsx`
  - Ejemplo: `HeroGallerySection.jsx`, `CloseLookSection.jsx`
- Hooks: `useXxx.js`
  - Ejemplo: `usePortfolioViewport.js`
- Utilidades de dominio: nombres explícitos
  - Ejemplo: `computePortfolioLayout`, `getPortfolioThemeColors`

## Regla de evolución

Cuando una lógica crece y deja de ser “presentacional”, se extrae:

1. de sección a `hooks/` si es reusable entre secciones,
2. de página a `components/` si solo afecta a una zona de composición,
3. de componente a `three/` si contiene renderizado WebGL.
