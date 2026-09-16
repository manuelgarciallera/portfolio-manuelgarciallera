# Esfera y nombre sin caja al cambiar tema

16/09/2026 · Codex · basef8395d4 · corrección solicitada por Manuel con captura.

Causa: `.rd-hero-art` tenía fondo opaco en desktop y mobile, y la escena WebGL pintaba un color de fondo completo. Ambos podían mostrar el color final mientras `.rd-root` interpolaba durante0,5s. Se hace transparente el contenedor y se elimina scene.background. El fondo cromático de la refracción se conserva exclusivamente en `MeshTransmissionMaterial.background`, cuyo render interno restaura el fondo original al terminar (código instalado de Drei revisado). Canvas ya tenía alpha:true. No cambia posición, nombre HTML, luces, geometría ni materiales ópticos restantes.

Prueba nueva `verify-hero-theme-transparency.mjs`: REDa6e93e por contenedor opaco. Compara los píxeles de cuatro esquinas con el fondo efectivo de la página, incluyendo transición congelada a250ms, mobile/desktop, WebGL y alternativa de movimiento reducido, en ambas direcciones. Los ajustes iniciales del test resolvieron selector duplicado, espera de hidratación y retorno al inicio tras ocultarse la cabecera; sin cambios de navegación.

Build30/tipos072756, lint/estructura2bc746 y presupuesto f3fdb1 PASS: home138731 B raw/50612 B gzip. Reserva2991c406-e480-4afa-9c11-384209638062. Pruebas finales y publicación pendientes al crear el recibo. Sin CMS/cookies/automatización ni procesos ajenos modificados.
