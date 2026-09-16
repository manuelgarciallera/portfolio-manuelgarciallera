# Orbe · eliminar medidas de layout por fotograma

Base `42b6540`, 17/09/2026. Cambio acotado autorizado por la revisión de rendimiento de Manuel. Reserva Hub `cbc5b55a-b845-43f6-9fd8-cf0a7a99edbe`.

## Evidencia y solución

La prueba `verify-orb-layout-cost.mjs` instrumenta el canvas real y el dibujo WebGL, sin sustituir el render. RED contra producción (`38d2c1`): 12 lecturas de `getBoundingClientRect` en 12 dibujos estables. Es trabajo repetido, aunque no toda lectura provoque un reflow.

`HeroOrbCanvas.tsx` conserva dimensiones en la clausura del efecto y las actualiza al recibir ResizeObserver. El gesto sigue midiendo coordenadas actuales, necesario tras scroll. No cambia shader, resolución, reloj, colores, geometría ni reglas de pausa por visibilidad. Tampoco se añaden dependencias.

GREEN desarrollo (`b0fa0b`/`3650f9`): cero lecturas adicionales durante 12 dibujos en390/1280; cambio de ancho CSS sin resize de ventana actualiza buffer y continúa animación. Compilado repite resultado (`d1a55b`).

## Verificaciones de esta ejecución

- 274 pruebas unitarias /43 archivos PASS (`7bf93b`).
- ESLint focal y diff check PASS (`dd776d`).
- Build aislado30rutas y TypeScript PASS (`b125b5`).
- Presupuesto público PASS: home138706B raw/50637B gzip (`5858c0`).
- Checkpoint protegido intacto `0f0adf686b2752e23c25d224f8c60815b10fd451` (`beda5e`).
- Pruebas compiladas de interacción390/1280 PASS (`0d396c`, `8d4f43`): presión sostenida, toque nativo emulado, liberar/cancelar/blur y scroll.
- Matriz pública390/1280 × claro/oscuro PASS (`c0540d` cierre): apariencia, resolución, animación, fuera de vista, movimiento reducido y pérdida de contexto; sin errores JS.

Esto elimina lecturas innecesarias del hilo principal; **no acredita una mejora de FPS concreta ni elimina el coste GPU**. El experimento anterior de shader fue descartado por empeorar; no forma parte de este cambio. No afirmar fluidez física a partir de SwiftShader.

## Entrega pendiente

Runtime `11b253298d996d05ec26c32c22188ae54d5e3695`, commit/push confirmado `daec07`. Preview `dpl_Z2shYkjhCDMs9c7qCVJXTuqSAoiJ` READY. CI35163886975: validate SUCCESS (`3bcb8d`); owner aún en ejecución al promover. Promoción autorizada crea nueva producción `dpl_CCMdh5LKN8bpidGS1Abj9gyZ7wsj` (`f9afd2`); falta confirmar READY/dominio y LIVE. Timeout inicial de API GitHub resuelto al reintentar; no se omitió CI.

CMS no publicado. Rollback runtime anterior `4cd3aac`. Conservar dev3015 y lab3017; detener únicamente el servidor de prueba3020 de esta ejecución.

Producción `dpl_CCMdh5LKN8bpidGS1Abj9gyZ7wsj` READY y alias original confirmado (`24c334`). LIVE390/1280 caché y resize PASS (`c8bcd3`), presión sostenida/liberación/cancelación/blur/scroll PASS (`0c2630`, `476959`). CI completo validate+owner SUCCESS (`dda3fd`). Escaneo de errores5min sin entradas (`c2eabd`), no garantía de ausencia global de errores. Servidor propio3020 detenido (`d078e9`), dev/lab preservados. Hito acotado publicado y verificado; próxima tarea CMS aislado, pendiente revisión física sin bloquear tareas seguras.
