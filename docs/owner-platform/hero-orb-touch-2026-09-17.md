# Orbe: contacto sin congelación y reacción líquida

Manuel reporta que tocar la pantalla congela el orbe y autoriza corregirlo, preferiblemente con deformación. Base fa664e1/runtime25cc2db. Reserva Hub2706a188-d40e-4d71-aeac-030418c1543a.

## Causa y cambio

La optimización anterior detenía WebGL con cualquier `touchstart` global y esperaba `touchend` para reanudar. Confundía contacto con desplazamiento y podía mantener el estado si faltaba la liberación.

- Eliminados estado `touching` y listeners globales touchstart/end/cancel.
- Solo scroll real móvil pausa el render; reanuda180ms después del último desplazamiento. El contacto estacionario no pausa.
- `pointerdown` pasivo sobre canvas introduce un impulso espacial que deforma el campo de distancia con una onda localizada. Válido con dedo, lápiz o botón primario de ratón, sin captura ni preventDefault.
- Impulso finito1,4s con decaimiento cuadrático por reloj real, independiente de pointerup. No bucle de estado ni React renders durante interacción. Ocultar página cancela el impulso. Pulsar fuera del radio de la escena no lo activa.
- Se conservan buffer máximo384 móvil/560 desktop,30dibujos/s, antialias de silueta, colores, geometría, offscreen y fallback estático reducido. El efecto es decorativo, no una simulación física.

## Verificación

- REDfb75e3: mantener un contacto detiene los dibujos. GREENd925f9:390/1280 continúan dibujando mientras el dedo permanece, el impulso llega al shader y decae aun sin evento de liberación. Scroll real cambia scrollY y pausa/reanuda correctamente.
- RED5b143b: imagen idéntica con/sin impulso. GREEN2ce70a: mismos tiempo/cámara, imagen diferente al deformar; contorno sigue con875 píxeles de alfa parcial y>56.000opacos. Sin impulso conserva los píxeles de la versión anterior. Captura revisada.
- ESLint focal, diff y274tests/43archivos PASS63f586.

Build aislado30rutas/tipos PASS cb95c1; presupuesto138706raw/50638gzip sin errores8e08d1. Prueba táctil repetida sobre compilación producción3020 PASS122012 ambos anchos.

Pendiente cierre: pruebas fallback, commit/push/publicación y prueba LIVE. Navegador Chromium con eventos sintéticos; no certifica GPU ni sensación del móvil físico de Manuel.
