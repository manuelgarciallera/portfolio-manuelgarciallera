# Performance Checklist

## Implemented

- Offscreen canvas/animation pause via `IntersectionObserver`.
- `sizes` attribute on critical images to reduce transfer bytes.
- Visual fallbacks for heavy scenes (Spline and reduced motion mode).
- Legacy code cleanup to reduce maintenance and runtime overhead.

## Engineering rules

1. Do not introduce new `requestAnimationFrame` loops without visibility gating.
2. Decorative canvases must include `aria-hidden="true"`.
3. Disable autoplay behavior when `prefers-reduced-motion` is active.
4. Responsive image blocks must include explicit `sizes`.
5. Track Core Web Vitals continuously (`web-vitals` + `/api/web-vitals`).

## Minimum gate before merge

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run audit:lighthouse:desktop`
