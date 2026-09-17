# Orbe · reloj durante cambios de tamaño

Base599f5ca, petición directa Manuel: vuelve a observar pausa al hacer scroll móvil. Reserva Hub3715cd35-5232-439e-8066-86de84b740a7.

## Reproducción y alcance

El gesto táctil CDP en Chromium móvil emulado390/DPR3 pasa en producción:77px de scroll en ambos sentidos, con tiempo del shader avanzando antes de touchEnd (541e8e). Eso NO reproduce ni descarta la observación física.

Se encuentra otro fallo concreto en el mismo ciclo: ResizeObserver llama restart, que cancela RAF y pone previous=0 incluso estando animando. Cambios de tamaño repetidos producen dibujos sin avance del reloj. Prueba con lienzo real alternando su ancho durante30frames: RED227d8d en producción. No se simula el shader ni el observador. El cambio de tamaño es inducido, no una prueba de que la barra del teléfono concreto sea la causa.

## Corrección

restart conserva el RAF ya programado cuando sigue visible/activo; el callback libera su identificador al empezar. Solo ocultación, fuera de vista, movimiento reducido y cierre detienen el ciclo. Resize sigue refrescando las dimensiones. Sin shader, resolución, geometría, color, scroll bloqueante ni dependencias nuevas.

GREENc9c1ef:30dibujos con2.7165s de avance durante resize continuo; gestos nativos emulados ambos sentidos pasan. 274 unitarias/43archivos2c1be5. Resto de verificación/publicación por completar.

## Limitaciones

Se pidió navegador y si reanuda al soltar mediante pregunta no bloqueante. Pendiente respuesta/prueba física; no declarar solucionadas todas las causas posibles de pausa o acreditar FPS móvil. requestAnimationFrame depende del navegador: [documentación MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame). No aplicar temporizadores forzados ni impedir scroll para ocultar el problema.
