# Esfera y nombre sin caja al cambiar tema

16/09/2026 · Codex · basef8395d4 · corrección solicitada por Manuel con captura.

Causa: `.rd-hero-art` tenía fondo opaco en desktop y mobile, y la escena WebGL pintaba un color de fondo completo. Ambos podían mostrar el color final mientras `.rd-root` interpolaba durante0,5s. Se hace transparente el contenedor y se elimina scene.background. El fondo cromático de la refracción se conserva exclusivamente en `MeshTransmissionMaterial.background`, cuyo render interno restaura el fondo original al terminar (código instalado de Drei revisado). Canvas ya tenía alpha:true. No cambia posición, nombre HTML, luces, geometría ni materiales ópticos restantes.

Prueba nueva `verify-hero-theme-transparency.mjs`: REDa6e93e por contenedor opaco. Compara los píxeles de cuatro esquinas con el fondo efectivo de la página, incluyendo transición congelada a250ms, mobile/desktop, WebGL y alternativa de movimiento reducido, en ambas direcciones. Los ajustes iniciales del test resolvieron selector duplicado, espera de hidratación y retorno al inicio tras ocultarse la cabecera; sin cambios de navegación.

Build30/tipos072756, lint/estructura2bc746 y presupuesto f3fdb1 PASS: home138731 B raw/50612 B gzip. Reserva2991c406-e480-4afa-9c11-384209638062. Pruebas finales y publicación pendientes al crear el recibo. Sin CMS/cookies/automatización ni procesos ajenos modificados.

GREEN local ocho transiciones e46fe4, incluida escena WebGL realmente lista. Captura desktop a mitad de transición revisada. Lint/diff final0ab8ba. Runtime fcf979e commit/push ee813f. No se añade dependencia; sharp ya disponible solo en la prueba, nunca importado por la web.

## Publicado y verificado

Producción dpl_J6FwFV3vmEGbTbig5CuGp9iJE4ug creada18:38:25CEST, READY/aliasmanuelgarciallera.com a94b55. LIVE ocho transiciones PASS7428c6. CI35123043004 detectó una expectativa antigua de fondo opaco en redesign-responsive.unit.test.ts (08b43d); se actualiza a transparente y se ejecutan todas las unitarias:279/43 PASS1b3468. Este ajuste solo afecta a pruebas, no requiere republicar el runtime. No se presenta la ejecución CI fallida como exitosa.

Rollback: dpl_9Z7CLuyw13oBgCpeK79wKHy3pGMh. Reserva liberada al entregar. Siguiente Manuel: revisión del cambio de tema en su dispositivo. Sin claves ni acciones adicionales para desplegar.
