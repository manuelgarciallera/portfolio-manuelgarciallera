# Stack Status (2026-ready)

## Installed and active

- `three`
- `@react-three/fiber`
- `@react-three/drei`
- `gsap` (+ `ScrollTrigger`)
- `lenis` (optional via feature flag)
- `@splinetool/react-spline` (isolated lab route)
- `@theatre/core` + `@theatre/studio` (isolated lab route)
- `web-vitals` (browser metrics collection)
- `lighthouse` (local quality audits)

## Compatibility notes

- `@theatre/r3f` is currently incompatible with `@react-three/fiber` v9 in this project.
- Theatre integration is implemented with imperative Three.js to keep compatibility and full code control.

## Lab routes

- `/lab/spline`
- `/lab/theatre`
