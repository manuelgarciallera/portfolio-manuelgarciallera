# Captura y registro de versiones desde UI

Base53a90bc, reserva acdab4ff. Pruebas browser-release.mjs y
browser-publication.mjs; no cambios runtime.

El ensayo sustituye la preparación API anterior por seleccionar página en
Capturar revisión, crear par de snapshots, seleccionar evidencia coincidente
y rellenar el formulario Registrar versión. Nombre, resumen, SHA, viewport,
puntuaciones, fuente y fecha se contrastan con la respuesta; documento de la
página debe seguir idéntico. El formulario queda bloqueado para duplicar y
ofrece enlace a la versión inmutable. La prueba de conflicto API sigue aparte.

Las puntuaciones80 y SHA repetido son datos sintéticos identificados en el
resumen, no mediciones ni commit real. No se publica nada. Restauración y
preview posteriores usan esta versión creada desde los controles.

Primer ensayo b437f9: registro UI390 pasa, falla negativo duplicado400 vs409.
Causa del harness: reconstruía petición usando quality persistida, que incluye
campos internos rechazados por normalizeReleaseQuality. Se repite ahora el
POST original aceptado, capturado desde la respuesta del navegador, sin
relajar contratos del servidor. Revisión read-only pidió comparar también
quality; aserción añadida para sus siete campos, excluyendo IDs internos.

Repetición completa `b3fe00`, salida0: captura/registro390/1280, conflicto409,
revisión, restauración, preview y conservación de documentos tras reinicio.
Aplicación y clúster cerrados; inventario4ada76 solo init/sleep. Lintf08b04 y
diffcheckb8ccc3 pasan. Solo tests/docs; sin nueva suite unitaria/types; el build
completo sí compila el CMS. PostgreSQL16/objetos/HTTPS locales aislados,
390/1280 emulados, checkout d004d7c con overlays y dependencias existentes.
No proveedor real ni creación de métricas automáticas. El formulario todavía
pide SHA y métricas manuales: es una limitación de autonomía para revisar en
el diseño con Manuel, no se sustituye silenciosamente durante su ausencia.
