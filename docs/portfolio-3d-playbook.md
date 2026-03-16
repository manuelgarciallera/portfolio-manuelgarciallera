# Portfolio 3D Playbook (React + Three + GSAP)

## Objetivo
Mantener una base profesional, escalable y optimizada para experiencias tipo Apple sin sacrificar estabilidad ni rendimiento.

## Stack objetivo
- `next` + `react`
- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `gsap` + `ScrollTrigger` (cuando haya secciones pin/scrub)
- `framer-motion` para microinteracciones de UI

## Regla de arquitectura
- UI por feature en `src/features/portfolio`.
- Secciones desacopladas en `src/features/portfolio/sections`.
- Datos de contenido en `content.js`.
- Utilidades de layout/responsive en `layout.js`.
- Evitar componentes monoliticos nuevos.

## Regla de animacion
- Usar una sola libreria por tipo de animacion:
  - `framer-motion`: estados locales de componentes.
  - `gsap/ScrollTrigger`: scroll orchestration, pin, scrub y timelines complejos.
- Respetar `prefers-reduced-motion`.
- No mezclar transiciones CSS y JS sobre la misma propiedad en el mismo elemento.

## Regla de 3D
- Escenas pesadas: lazy load por seccion.
- Limitar DPR en canvas (`Math.min(devicePixelRatio, 1.5/2)` segun seccion).
- Cleanup estricto en `useEffect`:
  - `dispose()` de geometries/materials/textures
  - `cancelAnimationFrame`
  - `disconnect()` de observers
- Modelos en formato `.glb`, optimizados (Draco/Meshopt cuando aplique).

## Regla de imagenes
- Usar `next/image` (no `img` crudo salvo excepcion justificada).
- Dominios remotos controlados en `next.config.ts`.
- Definir `sizes` y `priority` solo en elementos above-the-fold.

## Regla responsive (desktop-first actual)
- 4K como baseline visual.
- Ajustes progresivos para `<2560`, `<1920`, `<1440`, `<1200`.
- Mantener consistencia de:
  - alineacion de titulos
  - ritmo vertical entre bloques
  - escala proporcional de controles y pildoras

## Checklist antes de merge
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Verificacion visual en:
  - 3840x2160
  - 2560x1440
  - 1920x1080
  - 1536x864
