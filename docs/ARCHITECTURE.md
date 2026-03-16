# Portfolio Architecture

## Core principle
The codebase is organized by **feature/domain**, not by technical layer only.
Everything related to the main experience lives in `src/features/portfolio`.

## Portfolio module layers

- `PortfolioRuntime.tsx`
  - Feature entry point.
  - Wraps runtime with `ErrorBoundary`.
- `PortfolioPage.jsx`
  - Section orchestrator.
  - Owns feature-level state (theme, nav state, responsive layout vars).
- `sections/`
  - Visual sections with local behavior.
  - Canvas and animation logic stay close to each section.
- `three/`
  - Reusable Three.js resources (shaders, background canvas components).
- `hooks/`
  - Feature-specific hooks (`viewport`, reveal observers, Lenis bridge).
- `integrations/`
  - External tooling integration modules (`spline/`, `theatre/`).

## Naming conventions

- Section components: `PascalCaseSection.jsx`
  - Example: `HeroGallerySection.jsx`, `CloseLookSection.jsx`
- Hooks: `useXxx.js`
  - Example: `usePortfolioViewport.js`
- Domain helpers: explicit names
  - Example: `computePortfolioLayout`, `getPortfolioThemeColors`

## Evolution rule

When logic grows beyond presentational concerns:

1. move section-shared logic into `hooks/`,
2. move page composition blocks into `components/`,
3. move WebGL internals into `three/`.
