# Burbujas cítricas del Hero · 17/09/2026

Manuel autoriza integrar y publicar la prueba aunque no puede revisarla desde móvil. Conservar como vuelta atrás el runtime `32c669b`, producción `dpl_A2vKWCNNqpeG5pNauD7pE8BNncx6`. Base de trabajo `d8c78ef`; reserva Hub `47c2f1db`.

Implementación: módulo Canvas2D opcional, importado solo en desktop con puntero fino, hover y movimiento permitido. Gesto rápido sobre el orbe emite cinco burbujas naranjas en la dirección del ratón, máximo 28; se desvanecen al alcanzar cajas de caracteres del H1 o antes de 2,55 segundos. No intercepta eventos ni añade elementos al foco. Limpieza al cambiar preferencias, tamaño, ocultar pestaña o desmontar. No se modifica el shader, tamaño, tacto ni reloj del orbe.

Rendimiento: sin RAF de burbujas en reposo, coordenadas de letras cacheadas, resolución limitada a DPR 1,25 y dimensión 1920. Chunk opcional 4118 bytes / 1940 gzip. Presupuesto público original aprobado sin cambiar baseline (`05f250`); no es una medición de FPS en hardware físico. El coste adicional solo ocurre durante ráfagas desktop.

TDD: tres pruebas nuevas fallaron con el stub y pasan con el motor. 277 unitarias / 44 archivos PASS (`3d5fb4`), ESLint focal PASS. Build producción, tipos y 30 rutas PASS (`7d8d0b`). Verificación de navegador y publicación se registran a continuación cuando terminen.

La versión de laboratorio se conserva en `experiments/orb-bubbles/`, sin integrar sus controles ni proxy en la web pública.

Navegador local: gesto real produce dibujo visible, disolución completa, reposo sin dibujo, preferencias dinámicas y exclusión móvil/coarse PASS Chromium (`d17334`) y Firefox (`61e7b2`). Hover/seguimiento/click/salida/blur base PASS ambos (`906870`, `00dbf0`). Se corrigió un selector de prueba que esperaba el canvas animado cuando reduced-motion utiliza una imagen estática; no fue un fallo de producción. La primera prueba de tacto apuntó al servidor antiguo 3015 detenido, se repite contra 3020.
