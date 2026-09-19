# Refinamiento táctil de la M

Manuel aprueba el 19/09/2026: halo más evidente, ciclo completo de 1,2 s y vuelta al degradado original. Base recuperable: `4b7b105` (efecto anterior `2b1e016`).

## Implementación

Solo móvil y movimiento permitido. Dos copias del espectro recorren una anchura completa dentro de la faceta derecha. El fondo original permanece debajo; entrada/salida por opacidad para terminar sin salto. Halo cian/rosa reforzado, sin modificar desktop, geometría, Hero ni CMS. Temporizador de 1200 ms; cancelación, navegación y cleanup existentes conservados. Sin dependencias ni bucle de JS por fotograma.

## Evidencia local

- RED `0ae1eb`: falta el ciclo completo en el CSS anterior.
- GREEN `b95cff`: ciclo renderizado, recorrido unidireccional completo, 1200 ms, captura inicial/final idéntica y reduced motion.
- 280 pruebas unitarias / 45 archivos PASS (`69d744`); ESLint sin errores en la misma ejecución.
- Build 30 rutas y TypeScript PASS (`bcb1a2`).
- Presupuesto público PASS, sin actualizar baseline (`8e2a40`).
- Guardas responsive/móvil PASS (`60681e`).
- Toque/timeout/cancelación/reduced motion/navegación real/arrastre nativo emulado PASS (`b7c164`).

- Regresión 390/768/1280, dark/light, hover, teclado, sin overflow/errores de página PASS (última salida `89fb56`). Captura del halo revisada (`a43deb`); ESLint final PASS (`187bd2`).

Pendiente commit y publicación. No se afirma prueba en teléfono físico. Siguiente responsable: Codex verificación/publicación y Manuel valoración visual.
