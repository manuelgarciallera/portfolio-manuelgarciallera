# Orbe · reloj durante cambios de tamaño

Base599f5ca, petición directa Manuel: vuelve a observar pausa al hacer scroll móvil. Reserva Hub3715cd35-5232-439e-8066-86de84b740a7.

## Reproducción y alcance

El gesto táctil CDP en Chromium móvil emulado390/DPR3 pasa en producción:77px de scroll en ambos sentidos, con tiempo del shader avanzando antes de touchEnd (541e8e). Eso NO reproduce ni descarta la observación física.

Se encuentra otro fallo concreto en el mismo ciclo: ResizeObserver llama restart, que cancela RAF y pone previous=0 incluso estando animando. Cambios de tamaño repetidos producen dibujos sin avance del reloj. Prueba con lienzo real alternando su ancho durante30frames: RED227d8d en producción. No se simula el shader ni el observador. El cambio de tamaño es inducido, no una prueba de que la barra del teléfono concreto sea la causa.

## Corrección

restart conserva el RAF ya programado cuando sigue visible/activo; el callback libera su identificador al empezar. Solo ocultación, fuera de vista, movimiento reducido y cierre detienen el ciclo. Resize sigue refrescando las dimensiones. Sin shader, resolución, geometría, color, scroll bloqueante ni dependencias nuevas.

GREENc9c1ef:30dibujos con2.7165s de avance durante resize continuo; gestos nativos emulados ambos sentidos pasan. 274 unitarias/43archivos2c1be5. Resto de verificación/publicación por completar.

Runtime5df24e5 commit/push341da7. Touch sostenido/cancel/blur/scroll390/1280 PASS281a9b; matriz390/1280×claro/oscuro con fuera de vista, reduced-motion y pérdida de contexto PASS7abd56. ESLint/diffcheckb4dc26 y build aislado/tipos4e589f PASS. Dev3020 de este turno usa carpeta aisladaorb-scroll-dev; cambios automáticos de tsconfig retirados, sin delta de configuración. La carpeta dev anterior mostró un panic HMR al cerrar el turno previo, no se reutiliza ni se atribuye a producción.

## Limitaciones

Producción dpl_4iSgwLP2eBVASjGsWpM8xBRJWkAj READY/dominio original733720, runtime5df24e5. LIVEc248db: ambos gestos y resize continuo pasan,30dibujos/2.7162s durante resize. Logs5minsinentradasa993dd; no garantía de ausencia de errores de navegador. CI35184051125 validateSUCCESSc8d91a; owner todavía en ejecución al publicar (sin cambios CMS en este commit). Dev propio3020 detenidoa68399. Rollback públicofdafc99. Reserva3715cd35 liberada al entregar; prueba física pendiente.

Se pidió navegador y si reanuda al soltar mediante pregunta no bloqueante. Pendiente respuesta/prueba física; no declarar solucionadas todas las causas posibles de pausa o acreditar FPS móvil. requestAnimationFrame depende del navegador: [documentación MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame). No aplicar temporizadores forzados ni impedir scroll para ocultar el problema.

Actualización07:13: Manuel corrige navegador a **Firefox Android**. No asumir Brave. CI35184051125 completoSUCCESS341243. Instalado Firefox153 de Playwright para cobertura adicional; descarga inicial agota30s, reintento con límite120s termina1ee57a. `verify-orb-firefox-scroll.mjs` pasa contra dominio (3d74c1): viewport390, rueda±72px, reloj avanza1.12/1.18s y sin erroresJS. Es Firefox de escritorio, NO Firefox Android ni gesto táctil nativo. No se reproduce la pausa física; pregunta sobre reanudación sigue pendiente. Investigación Bugzilla solo encuentra informes históricos de entornos distintos: no se usan como diagnóstico actual ni justifican otra mutación pública.
