# Performance Checklist (actual)

## Ya implementado

- Pausa de animaciones/canvas fuera de viewport con `IntersectionObserver`.
- `sizes` en imágenes críticas para reducir bytes en desktop/mobile.
- Fallbacks visuales para escenas pesadas (Spline / reduced motion).
- Limpieza de código no usado para reducir superficie de mantenimiento.

## Reglas de implementación

1. No añadir nuevos `requestAnimationFrame` sin condición de visibilidad.
2. Todo canvas decorativo debe llevar `aria-hidden="true"`.
3. Evitar autoplay si `prefers-reduced-motion` está activo.
4. Todo bloque con imágenes de ancho variable debe incluir `sizes`.

## Validación mínima antes de merge

- `npm run lint`
- `npm run typecheck`
- `npm run build`
