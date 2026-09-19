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

## Publicación y cierre

- Commit `12a5085` empujado a la rama habitual. CI `35431813778`: validate y owner SUCCESS (`0cc8d5`).
- Preview `dpl_2WuG5VCemwofCxWjknVnWrrjiosS` READY. Producción `dpl_SN7ekcctNB83babGNT1FdiCNUDQK` READY (`864177`), dominio `https://manuelgarciallera.com` confirmado por el cierre del redeploy (`ac45da`). El intento de promoción adicional devolvió 409 porque ya era producción; no se repitió.
- LIVE: ciclo, halo, timeout, cancelación, reduced motion, navegación por toque y arrastre nativo emulado PASS (`8f10b2`). Consulta de logs de error de los últimos 5 minutos sin entradas (`1196f8`).
- Servidor local propio detenido. Cambios ajenos preservados y registro compartido fuera del commit.

No se afirma prueba en teléfono físico. Reserva `7e85be39` liberada. Siguiente responsable: Manuel valoración visual; versión anterior recuperable en `4b7b105`.
